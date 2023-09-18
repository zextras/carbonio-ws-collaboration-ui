/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MultiButton, Tooltip } from '@zextras/carbonio-design-system';
import { filter, map } from 'lodash';
import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { MeetingsApi } from '../../../network';
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

	const { meetingId }: Record<string, string> = useParams();
	const myUserId = useStore(getUserId);

	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, myUserId));
	const selectedVideoDeviceId = useStore((store) => getSelectedVideoDeviceId(store, meetingId));
	const createVideoOutConn = useStore((store) => store.createVideoOutConn);
	const videoOutConn = useStore((store) => store.activeMeeting[meetingId]?.videoOutConn);
	const closeVideoOutConn = useStore((store) => store.closeVideoOutConn);
	const removeLocalStreams = useStore((store) => store.removeLocalStreams);
	const setSelectedDeviceId = useStore((store) => store.setSelectedDeviceId);
	const setLocalStreams = useStore((store) => store.setLocalStreams);

	const [videoMediaList, setVideoMediaList] = useState<[] | MediaDeviceInfo[]>([]);

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
				if (!videoOutConn) {
					createVideoOutConn(meetingId, true, selectedVideoDeviceId);
				} else {
					getVideoStream(selectedVideoDeviceId).then((stream) => {
						videoOutConn
							?.updateLocalStreamTrack(stream)
							.then(() => MeetingsApi.updateMediaOffer(meetingId, STREAM_TYPE.VIDEO, true));
					});
				}
			} else {
				closeVideoOutConn(meetingId);
				MeetingsApi.updateMediaOffer(meetingId, STREAM_TYPE.VIDEO, false).then(() =>
					removeLocalStreams(meetingId, STREAM_TYPE.VIDEO)
				);
			}
		},
		[
			videoStatus,
			videoOutConn,
			createVideoOutConn,
			meetingId,
			selectedVideoDeviceId,
			closeVideoOutConn,
			removeLocalStreams
		]
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
				iconColor="gray6"
				backgroundColor="primary"
				primaryIcon={videoStatus ? 'Video' : 'VideoOff'}
				icon={isVideoListOpen ? 'ChevronDown' : 'ChevronUp'}
				onClick={toggleVideoStream}
				items={mediaVideoList}
				size="large"
				shape="regular"
				dropdownProps={{
					forceOpen: isVideoListOpen,
					onClick: toggleVideoDropdown,
					dropdownListRef: videoDropdownRef
				}}
			/>
		</Tooltip>
	);
};

export default CameraButton;
