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
	useContext,
	useEffect,
	useMemo,
	useState
} from 'react';

import { DropdownItem, Tooltip } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { MultiActionButton } from './MultiActionButton';
import useBrowserPermission from '../../../hooks/useMediaDevices';
import MeetingsApi from '../../../network/apis/MeetingsApi';
import { getSelectedVideoDeviceId } from '../../../store/selectors/ActiveMeetingSelectors';
import { getParticipantVideoStatus } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { getVideoStream } from '../../../utils/UserMediaManager';
import { RouterContext } from '../../contexts/routerContext';

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
	const giveMediaPermissionSnackbar = t(
		'meeting.interactions.browserPermission',
		'Grant browser permissions to enable resources'
	);
	const selectedDeviceTooltip = t('meeting.interactions.selectedDeviceTooltip', 'Selected device');
	const disableButtonLabel = t(
		'meeting.interactions.disabled',
		'There are connection problems, please try again later.'
	);
	const unknownDeviceLabel = t('meeting.interactions.unknownDevice', 'Unknown device');

	const { meetingId } = useContext(RouterContext);
	const myUserId = useStore(getUserId);

	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, myUserId));
	const selectedVideoDeviceId = useStore(getSelectedVideoDeviceId);
	const videoOutConn = useStore((store) => store.activeMeeting?.videoOutConn);
	const setSelectedDeviceId = useStore((store) => store.setSelectedDeviceId);
	const setLocalStreams = useStore((store) => store.setLocalStreams);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const { permission, deviceList, noDevices } = useBrowserPermission('video');

	const [buttonStatus, setButtonStatus] = useState<boolean>(true);

	useEffect(() => {
		setButtonStatus(true);
	}, [videoStatus]);

	const onClickVideoItem = useCallback(
		(videoItem: MediaDeviceInfo) => {
			if (videoStatus) {
				getVideoStream(videoItem.deviceId).then((stream) => {
					videoOutConn?.updateLocalStreamTrack(stream).then(() => {
						setLocalStreams(STREAM_TYPE.VIDEO, stream);
						setSelectedDeviceId(STREAM_TYPE.VIDEO, videoItem.deviceId);
					});
				});
			} else {
				setSelectedDeviceId(STREAM_TYPE.VIDEO, videoItem.deviceId);
			}
		},
		[setLocalStreams, setSelectedDeviceId, videoOutConn, videoStatus]
	);

	const mediaVideoList: DropdownItem[] = useMemo(
		() =>
			map(deviceList, (videoItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: videoItem.label ? videoItem.label : unknownDeviceLabel,
				onClick: () => onClickVideoItem(videoItem),
				icon: selectedVideoDeviceId === videoItem.deviceId ? 'AcceptanceMeeting' : undefined,
				disabled: selectedVideoDeviceId === videoItem.deviceId,
				tooltipLabel:
					selectedVideoDeviceId === videoItem.deviceId ? selectedDeviceTooltip : undefined,
				value: videoItem.deviceId
			})),
		[deviceList, unknownDeviceLabel, selectedVideoDeviceId, selectedDeviceTooltip, onClickVideoItem]
	);

	const toggleVideoStream = useCallback(
		(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			event.stopPropagation();
			setButtonStatus(false);
			if (!videoStatus) {
				if (!videoOutConn?.peerConn) {
					videoOutConn?.startVideo(selectedVideoDeviceId).catch(() => {
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
		[videoStatus, videoOutConn, selectedVideoDeviceId, meetingId]
	);

	const tooltipLabel = useMemo(() => {
		if (permission !== 'granted') return giveMediaPermissionSnackbar;
		if (!websocketNetworkStatus) return disableButtonLabel;
		return videoStatus ? disableCamLabel : enableCamLabel;
	}, [
		permission,
		giveMediaPermissionSnackbar,
		websocketNetworkStatus,
		disableButtonLabel,
		videoStatus,
		disableCamLabel,
		enableCamLabel
	]);

	return (
		<Tooltip placement="top" label={tooltipLabel}>
			<MultiActionButton
				showItems={isVideoListOpen}
				setShowItems={setIsVideoListOpen}
				onClick={toggleVideoStream}
				items={mediaVideoList}
				disabled={!buttonStatus || !websocketNetworkStatus || permission !== 'granted' || noDevices}
				data-testid="cameraButton"
				icon={videoStatus ? 'Video' : 'VideoOff'}
				listRef={videoDropdownRef}
			/>
		</Tooltip>
	);
};

export default CameraButton;
