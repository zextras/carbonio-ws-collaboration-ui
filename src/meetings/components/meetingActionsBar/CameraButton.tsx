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

import { MultiButton, Tooltip } from '@zextras/carbonio-design-system';
import { filter, map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

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

	const { meetingId }: MeetingRoutesParams = useParams();
	const myUserId = useStore(getUserId);

	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, myUserId));
	const selectedVideoDeviceId = useStore((store) => getSelectedVideoDeviceId(store, meetingId));
	const videoOutConn = useStore((store) => store.activeMeeting[meetingId]?.videoOutConn);
	const setSelectedDeviceId = useStore((store) => store.setSelectedDeviceId);
	const setLocalStreams = useStore((store) => store.setLocalStreams);

	const [buttonStatus, setButtonStatus] = useState<boolean>(true);
	const [videoMediaList, setVideoMediaList] = useState<[] | MediaDeviceInfo[]>([]);

	useEffect(() => {
		setButtonStatus(true);
	}, [videoStatus]);

	const mediaVideoList = useMemo(
		() =>
			map(videoMediaList, (videoItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: videoItem.label ? videoItem.label : `device-${i}`,
				onClick: (): void => {
					if (videoStatus) {
						getVideoStream(videoItem.deviceId).then((stream) => {
							videoOutConn?.updateLocalStreamTrack(stream).then(() => {
								setLocalStreams(meetingId, STREAM_TYPE.VIDEO, stream);
								setSelectedDeviceId(meetingId, STREAM_TYPE.VIDEO, videoItem.deviceId);
							});
						});
					} else {
						setSelectedDeviceId(meetingId, STREAM_TYPE.VIDEO, videoItem.deviceId);
					}
				},
				value: videoItem.deviceId
			})),
		[videoMediaList, videoStatus, videoOutConn, setLocalStreams, meetingId, setSelectedDeviceId]
	);

	const toggleVideoDropdown = useCallback(() => {
		setIsVideoListOpen((prevState) => !prevState);
	}, [setIsVideoListOpen]);

	const toggleVideoStream = useCallback(
		(event) => {
			event.stopPropagation();
			if (!videoStatus) {
				if (!videoOutConn?.peerConn) {
					videoOutConn?.startVideo(selectedVideoDeviceId);
				} else {
					getVideoStream(selectedVideoDeviceId).then((stream) => {
						videoOutConn
							?.updateLocalStreamTrack(stream)
							.then(() => MeetingsApi.updateMediaOffer(meetingId, STREAM_TYPE.VIDEO, true));
					});
				}
			} else {
				videoOutConn?.stopVideo();
			}
			setButtonStatus(false);
		},
		[videoStatus, videoOutConn, selectedVideoDeviceId, meetingId]
	);

	const updateListOfDevices = useCallback(() => {
		navigator.mediaDevices
			.enumerateDevices()
			.then((devices) => {
				const videoInputs: [] | MediaDeviceInfo[] | any = filter(
					devices,
					(device) => device.kind === 'videoinput' && device
				);
				setVideoMediaList(videoInputs);
			})
			.catch();
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

	return (
		<Tooltip placement="top" label={videoStatus ? disableCamLabel : enableCamLabel}>
			<MultiButton
				background="primary"
				data-testid="cameraButton"
				primaryIcon={videoStatus ? 'Video' : 'VideoOff'}
				icon={isVideoListOpen ? 'ChevronDown' : 'ChevronUp'}
				onClick={toggleVideoStream}
				items={mediaVideoList}
				size="large"
				shape="regular"
				dropdownProps={{
					forceOpen: isVideoListOpen,
					onClick: toggleVideoDropdown,
					dropdownListRef: videoDropdownRef,
					items: mediaVideoList
				}}
				disabledPrimary={!buttonStatus}
				disabledSecondary={!buttonStatus}
			/>
		</Tooltip>
	);
};

export default CameraButton;
