/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';

import {
	CreateSnackbarFn,
	DropdownItem,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { filter, map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { MultiActionButton } from './MultiActionButton';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import MeetingsApi from '../../../network/apis/MeetingsApi';
import { getSelectedVideoDeviceId } from '../../../store/selectors/ActiveMeetingSelectors';
import { getParticipantVideoStatus } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { getVideoStream } from '../../../utils/UserMediaManager';

type CamButtonProps = {
	videoDropdownRef: React.RefObject<HTMLDivElement>;
	isVideoListOpen: boolean;
	setIsVideoListOpen: Dispatch<SetStateAction<boolean>>;
};

const CameraButton = ({
	videoDropdownRef,
	isVideoListOpen,
	setIsVideoListOpen
}: CamButtonProps): ReactElement => {
	const [t] = useTranslation();

	const disableCamLabel = t('meeting.interactions.disableCamera', 'Disable camera');
	const enableCamLabel = t('meeting.interactions.enableCamera', 'Enable camera');
	const understoodAction = t('action.understood', 'UNDERSTOOD');
	const giveMediaPermissionSnackbar = t(
		'meeting.interactions.browserPermission',
		'Grant browser permissions to enable resources'
	);
	const selectedDeviceTooltip = t('meeting.interactions.selectedDeviceTooltip', 'Selected device');
	const disableButtonLabel = t(
		'meeting.interactions.disabled',
		'There are connection problems, please try again later.'
	);

	const { meetingId } = useParams<MeetingRoutesParams>();
	const myUserId = useStore(getUserId);

	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, myUserId));
	const selectedVideoDeviceId = useStore((store) => getSelectedVideoDeviceId(store, meetingId!));
	const videoOutConn = useStore((store) => store.activeMeeting[meetingId!]?.videoOutConn);
	const setSelectedDeviceId = useStore((store) => store.setSelectedDeviceId);
	const setLocalStreams = useStore((store) => store.setLocalStreams);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const [buttonStatus, setButtonStatus] = useState<boolean>(true);
	const [videoMediaList, setVideoMediaList] = useState<[] | MediaDeviceInfo[]>([]);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const mediaPermissionSnackbar = useCallback(
		() =>
			createSnackbar({
				key: new Date().toLocaleString(),
				severity: 'info',
				label: giveMediaPermissionSnackbar,
				actionLabel: understoodAction,
				disableAutoHide: true
			}),
		[createSnackbar, giveMediaPermissionSnackbar, understoodAction]
	);

	useEffect(() => {
		setButtonStatus(true);
	}, [videoStatus]);

	const mediaVideoList: DropdownItem[] = useMemo(
		() =>
			map(videoMediaList, (videoItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: videoItem.label ? videoItem.label : `device-${i}`,
				onClick: (): void => {
					if (videoStatus) {
						getVideoStream(videoItem.deviceId).then((stream) => {
							videoOutConn?.updateLocalStreamTrack(stream).then(() => {
								setLocalStreams(meetingId!, STREAM_TYPE.VIDEO, stream);
								setSelectedDeviceId(meetingId!, STREAM_TYPE.VIDEO, videoItem.deviceId);
							});
						});
					} else {
						setSelectedDeviceId(meetingId!, STREAM_TYPE.VIDEO, videoItem.deviceId);
					}
				},
				icon: selectedVideoDeviceId === videoItem.deviceId ? 'AcceptanceMeeting' : undefined,
				disabled: selectedVideoDeviceId === videoItem.deviceId,
				tooltipLabel:
					selectedVideoDeviceId === videoItem.deviceId ? selectedDeviceTooltip : undefined,
				value: videoItem.deviceId
			})),
		[
			videoMediaList,
			selectedVideoDeviceId,
			selectedDeviceTooltip,
			videoStatus,
			meetingId,
			videoOutConn,
			setLocalStreams,
			setSelectedDeviceId
		]
	);

	const toggleVideoStream = useCallback(
		(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			event.stopPropagation();
			setButtonStatus(false);
			if (!videoStatus) {
				if (!videoOutConn?.peerConn) {
					videoOutConn?.startVideo(selectedVideoDeviceId).catch(() => {
						mediaPermissionSnackbar();
						setButtonStatus(true);
					});
				} else {
					getVideoStream(selectedVideoDeviceId)
						.then((stream) => {
							videoOutConn
								?.updateLocalStreamTrack(stream)
								.then(() => MeetingsApi.updateMediaOffer(meetingId!, STREAM_TYPE.VIDEO, true));
						})
						.catch((e) => {
							setButtonStatus(true);
							console.log(e);
						});
				}
			} else {
				videoOutConn?.stopVideo();
			}
		},
		[videoStatus, videoOutConn, selectedVideoDeviceId, mediaPermissionSnackbar, meetingId]
	);

	const updateListOfDevices = useCallback(() => {
		navigator.mediaDevices
			.enumerateDevices()
			.then((devices) => {
				const videoInputs: [] | MediaDeviceInfo[] = filter(
					devices,
					(device) => device.kind === 'videoinput' && device
				) as MediaDeviceInfo[];
				setVideoMediaList(videoInputs);
			})
			.catch((e) => {
				console.log(e);
			});
	}, []);

	/**
	 * This useEffect check when the user connects a new webcam device and update the list of resources
	 * on Firefox to be able to works it needs to have a device already in use otherwise if user is muted
	 * it will not show the new device
	 */
	useEffect(() => {
		updateListOfDevices();
		navigator.mediaDevices.addEventListener('devicechange', updateListOfDevices);

		return (): void => {
			navigator.mediaDevices.removeEventListener('devicechange', updateListOfDevices);
		};
	}, [updateListOfDevices]);

	const tooltipLabel = useMemo(() => {
		if (!websocketNetworkStatus) return disableButtonLabel;
		return videoStatus ? disableCamLabel : enableCamLabel;
	}, [websocketNetworkStatus, disableButtonLabel, videoStatus, disableCamLabel, enableCamLabel]);

	return (
		<Tooltip placement="top" label={tooltipLabel}>
			<MultiActionButton
				showItems={isVideoListOpen}
				setShowItems={setIsVideoListOpen}
				onClick={toggleVideoStream}
				items={mediaVideoList}
				disabled={!buttonStatus || !websocketNetworkStatus}
				data-testid="cameraButton"
				icon={videoStatus ? 'Video' : 'VideoOff'}
				listRef={videoDropdownRef}
			/>
		</Tooltip>
	);
};

export default CameraButton;
