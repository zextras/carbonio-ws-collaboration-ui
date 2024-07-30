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
	MultiButton,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { filter, map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { MeetingRoutesParams } from '../../../hooks/useRouting';
import MeetingsApi from '../../../network/apis/MeetingsApi';
import {
	getIsBackgroundBlurred,
	getSelectedVideoDeviceId
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getParticipantVideoStatus } from '../../../store/selectors/MeetingSelectors';
import { getCapability, getUserId } from '../../../store/selectors/SessionSelectors';
import { getIsUserGuest } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';
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
	const devicesTitle = t('meeting.interactions.title.devices', 'Devices');
	const videoEffectTitle = t('meeting.interactions.title.videoEffect', 'Video effect');
	const removeBlurLabel = t('meeting.interactions.option.removeBlur', 'Remove blur effect');
	const applyBlurLabel = t('meeting.interactions.option.applyBlur', 'Apply blur effect');
	const turnOnCameraTooltip = t(
		'meeting.interactions.userHint',
		'Turn on the camera to select a video effect'
	);
	const selectedDeviceTooltip = t(
		'meeting.interactions.selectedDeviceTooltip',
		'This device is selected'
	);

	const { meetingId }: MeetingRoutesParams = useParams();
	const myUserId = useStore(getUserId);

	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, myUserId));
	const selectedVideoDeviceId = useStore((store) => getSelectedVideoDeviceId(store, meetingId));
	const videoOutConn = useStore((store) => store.activeMeeting[meetingId]?.videoOutConn);
	const setSelectedDeviceId = useStore((store) => store.setSelectedDeviceId);
	const setLocalStreams = useStore((store) => store.setLocalStreams);
	const setBlur = useStore((store) => store.setBlur);
	const isBlur = useStore((store) => getIsBackgroundBlurred(store, meetingId));
	const canUseVirtualBackground = useStore((store) =>
		getCapability(store, CapabilityType.CAN_USE_VIRTUAL_BACKGROUND)
	);
	const isUserGuest = useStore((store) => getIsUserGuest(store, myUserId ?? ''));

	const [buttonStatus, setButtonStatus] = useState<boolean>(true);
	const [videoMediaList, setVideoMediaList] = useState<[] | MediaDeviceInfo[]>([]);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const mediaPermissionSnackbar = useCallback(
		() =>
			createSnackbar({
				key: new Date().toLocaleString(),
				type: 'info',
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
						setBlur(meetingId, false);
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
			setBlur,
			meetingId,
			videoOutConn,
			setLocalStreams,
			setSelectedDeviceId
		]
	);

	const onCLickBlur = useCallback(() => {
		setBlur(meetingId, !isBlur);
	}, [isBlur, meetingId, setBlur]);

	const dropdownList = useMemo(() => {
		const list: DropdownItem[] = [];
		if (canUseVirtualBackground || isUserGuest) {
			list.push({
				id: 'video-effect',
				label: videoEffectTitle,
				disabled: true,
				customComponent: <Text weight="bold">{videoEffectTitle}</Text>
			});
			list.push({
				id: 'blur',
				icon: isBlur ? 'Avatar' : 'AvatarOutline',
				label: isBlur ? removeBlurLabel : applyBlurLabel,
				disabled: !videoStatus,
				tooltipLabel: !videoStatus ? turnOnCameraTooltip : undefined,
				onClick: onCLickBlur
			});
			list.push({ type: 'divider', id: 'divider', label: 'divider' });
		}
		list.push({
			id: 'devices',
			label: devicesTitle,
			disabled: true,
			customComponent: <Text weight="bold">{devicesTitle}</Text>
		});
		return list.concat(mediaVideoList);
	}, [
		canUseVirtualBackground,
		isUserGuest,
		devicesTitle,
		mediaVideoList,
		videoEffectTitle,
		isBlur,
		removeBlurLabel,
		applyBlurLabel,
		videoStatus,
		turnOnCameraTooltip,
		onCLickBlur
	]);

	const toggleVideoDropdown = useCallback(() => {
		setIsVideoListOpen((prevState) => !prevState);
	}, [setIsVideoListOpen]);

	const toggleVideoStream = useCallback(
		(event) => {
			event.stopPropagation();
			setButtonStatus(false);
			if (!videoStatus) {
				if (!videoOutConn?.peerConn) {
					videoOutConn?.startVideo(selectedVideoDeviceId).catch((e) => {
						mediaPermissionSnackbar();
						setButtonStatus(true);
						console.log(e);
					});
				} else {
					getVideoStream(selectedVideoDeviceId)
						.then((stream) => {
							videoOutConn
								?.updateLocalStreamTrack(stream)
								.then(() => MeetingsApi.updateMediaOffer(meetingId, STREAM_TYPE.VIDEO, true));
						})
						.catch((e) => {
							setButtonStatus(true);
							console.log(e);
						});
				}
			} else {
				videoOutConn?.stopVideo();
				setBlur(meetingId, false);
			}
		},
		[videoStatus, videoOutConn, selectedVideoDeviceId, mediaPermissionSnackbar, meetingId, setBlur]
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

	return (
		<Tooltip placement="top" label={videoStatus ? disableCamLabel : enableCamLabel}>
			<MultiButton
				background={'primary'}
				data-testid="cameraButton"
				primaryIcon={videoStatus ? 'Video' : 'VideoOff'}
				icon={isVideoListOpen ? 'ChevronDown' : 'ChevronUp'}
				onClick={toggleVideoStream}
				items={dropdownList}
				size="large"
				shape="regular"
				dropdownProps={{
					forceOpen: isVideoListOpen,
					onClick: toggleVideoDropdown,
					dropdownListRef: videoDropdownRef,
					items: dropdownList,
					width: 'fit-content'
				}}
				disabledPrimary={!buttonStatus}
				disabledSecondary={!buttonStatus}
			/>
		</Tooltip>
	);
};

export default CameraButton;
