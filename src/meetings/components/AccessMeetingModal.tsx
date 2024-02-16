/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Button,
	Container,
	Modal,
	MultiButton,
	Padding,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { filter, find, map } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import Tile from './tile/Tile';
import useRouting from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import { getMeeting } from '../../store/selectors/MeetingSelectors';
import {
	getRoomMembers,
	getRoomNameSelector,
	getRoomTypeSelector
} from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { Member, RoomType } from '../../types/store/RoomTypes';
import { BrowserUtils } from '../../utils/BrowserUtils';
import { getAudioAndVideo } from '../../utils/UserMediaManager';

type AccessMeetingModalProps = {
	roomId: string;
};

const VideoTile = styled(Container)`
	box-sizing: border-box;
	position: relative;
	list-style: none;
	height: ${({ width }): string => `calc(calc(${width}px / 16) * 9)`};
	width: ${({ width }): string => `${width}px`};
	background: ${({ theme }): string => theme.palette.gray0.regular};
	border-radius: 0.3125rem !important;
	overflow: hidden;
`;

const CustomModal = styled(Modal)`
	cursor: default;
	user-select: none;
`;

const AccessMeetingModal = ({ roomId }: AccessMeetingModalProps): ReactElement => {
	const [t] = useTranslation();
	const enter = t('action.enter', 'Enter');
	const disableMicLabel = t('meeting.interactions.disableMicrophone', 'Disable microphone');
	const enableMicLabel = t('meeting.interactions.enableMicrophone', 'Enable microphone');
	const disableCamLabel = t('meeting.interactions.disableCamera', 'Disable camera');
	const enableCamLabel = t('meeting.interactions.enableCamera', 'Enable camera');
	const playMicLabel = t('meeting.interactions.playMic', 'Start microphone testing');
	const stopMicLabel = t('meeting.interactions.stopMic', 'Stop microphone testing');
	const joinMeetingDescription = t(
		'meeting.joinMeetingDescription',
		'How do you want to join this meeting?'
	);
	const setInputDescription = t(
		'meeting.setInputDescription',
		'Set your input devices by choosing them from dropdown menu'
	);

	const enterButtonDisabledTooltip = t(
		'meeting.startModal.audioAndVideoLoading',
		'Assets are loading'
	);

	const conversationTitle = useStore((store) => getRoomNameSelector(store, roomId));

	const groupTitle = t(
		'meeting.startModal.enterRoomMeetingTitle',
		`Participate to ${conversationTitle} meeting`,
		{ meetingTitle: conversationTitle }
	);
	const oneToOneTitle = t(
		'meeting.startModal.enterOneToOneMeetingTitle',
		`Start meeting with ${conversationTitle}`,
		{ meetingTitle: conversationTitle }
	);

	const { goToMeetingPage } = useRouting();

	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));

	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);
	const sessionId: string | undefined = useStore((store) => store.session.id);
	const roomMembers: Member[] | undefined = useStore((state) => getRoomMembers(state, roomId));
	const meeting = useStore((store) => getMeeting(store, roomId));

	const [videoStreamEnabled, setVideoStreamEnabled] = useState<boolean>(false);
	const [audioStreamEnabled, setAudioStreamEnabled] = useState<boolean>(false);
	const [audioMediaList, setAudioMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	const [videoMediaList, setVideoMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | undefined>(undefined);
	const [selectedVideoDevice, setSelectedVideoDevice] = useState<string | undefined>(undefined);
	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [wrapperWidth, setWrapperWidth] = useState<number>(0);
	const [videoPlayerTestMuted, setVideoPlayerTestMuted] = useState<boolean>(true);
	const [enterButtonIsEnabled, setEnterButtonIsEnabled] = useState<boolean>(false);

	const wrapperRef = useRef<HTMLDivElement>(null);
	const videoStreamRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (wrapperRef.current) setWrapperWidth(wrapperRef.current.offsetWidth);
	}, [wrapperRef]);

	useEffect(() => {
		if (videoStreamRef.current) {
			videoStreamRef.current.srcObject = streamTrack;
			setEnterButtonIsEnabled(true);
		}
	}, [streamTrack, audioStreamEnabled, videoStreamEnabled]);

	const areNetworksUp = useMemo(() => {
		if (chatsBeNetworkStatus !== undefined && websocketNetworkStatus !== undefined) {
			return chatsBeNetworkStatus && websocketNetworkStatus;
		}
		return false;
	}, [chatsBeNetworkStatus, websocketNetworkStatus]);

	const modalTitle = useMemo(
		() => (roomType === RoomType.ONE_TO_ONE ? oneToOneTitle : groupTitle),
		[groupTitle, oneToOneTitle, roomType]
	);

	const memberId: string | undefined = useMemo(() => {
		const user: Member | undefined = find(roomMembers, (member) => member.userId === sessionId);
		return user?.userId;
	}, [roomMembers, sessionId]);

	const toggleStreams = useCallback(
		(audio: boolean, video: boolean, audioId: string | undefined, videoId: string | undefined) => {
			if (streamTrack != null) {
				const tracks = streamTrack.getTracks();
				tracks.forEach((track) => track.stop());
			}

			if (!audio && !video) {
				getAudioAndVideo(true, false).then((stream: MediaStream) => {
					const tracks = stream.getTracks();
					tracks.forEach((track) => track.stop());
					setStreamTrack(stream);
					setAudioStreamEnabled(audio);
					setVideoStreamEnabled(video);
					setEnterButtonIsEnabled(true);
				});
			} else {
				getAudioAndVideo({ noiseSuppression: true, echoCancellation: true }).then(
					(stream: MediaStream) => {
						const tracks = stream.getTracks();
						tracks.forEach((track) => track.stop());
					}
				);
				getAudioAndVideo(
					audio
						? audioId
							? {
									deviceId: { exact: audioId },
									noiseSuppression: true,
									echoCancellation: true
								}
							: { noiseSuppression: true, echoCancellation: true }
						: false,
					video ? (videoId ? { deviceId: { exact: videoId } } : true) : false
				)
					.then((stream: MediaStream) => {
						setStreamTrack(stream);
						setAudioStreamEnabled(audio);
						setVideoStreamEnabled(video);
						setSelectedVideoDevice(videoId);
						setSelectedAudioDevice(audioId);
						setEnterButtonIsEnabled(true);
					})
					.catch((e) => console.error(e));
			}
		},
		[streamTrack]
	);

	const mediaVideoList = useMemo(
		() =>
			map(videoMediaList, (videoItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: videoItem.label ? videoItem.label : `device-${i}`,
				onClick: (): void => {
					if (videoStreamEnabled) {
						setEnterButtonIsEnabled(false);
						toggleStreams(audioStreamEnabled, true, selectedAudioDevice, videoItem.deviceId);
					} else {
						setSelectedVideoDevice(videoItem.deviceId);
					}
				},
				selected: videoItem.deviceId === selectedVideoDevice,
				value: videoItem.deviceId
			})),
		[
			audioStreamEnabled,
			selectedAudioDevice,
			selectedVideoDevice,
			toggleStreams,
			videoMediaList,
			videoStreamEnabled
		]
	);

	const mediaAudioList = useMemo(
		() =>
			map(audioMediaList, (audioItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: audioItem.label ? audioItem.label : `device-${i}`,
				onClick: (): void => {
					if (audioStreamEnabled) {
						setEnterButtonIsEnabled(false);
						toggleStreams(true, videoStreamEnabled, audioItem.deviceId, selectedVideoDevice);
					} else {
						setSelectedAudioDevice(audioItem.deviceId);
					}
				},
				selected: audioItem.deviceId === selectedAudioDevice,
				value: audioItem.deviceId
			})),
		[
			audioMediaList,
			audioStreamEnabled,
			selectedAudioDevice,
			selectedVideoDevice,
			toggleStreams,
			videoStreamEnabled
		]
	);

	const updateListOfDevices = useCallback(() => {
		navigator.mediaDevices
			.enumerateDevices()
			.then((devices) => {
				const audioInputs: [] | MediaDeviceInfo[] | any = filter(
					devices,
					(device) => device.kind === 'audioinput' && device
				);
				const videoInputs: [] | MediaDeviceInfo[] | any = filter(
					devices,
					(device: MediaDeviceInfo) => device.kind === 'videoinput' && device
				);
				setAudioMediaList(audioInputs);
				setVideoMediaList(videoInputs);
			})
			.catch();
	}, []);

	useEffect(() => {
		if (BrowserUtils.isFirefox()) {
			navigator.mediaDevices.enumerateDevices().then((list) => {
				const firstAudioInputForPermissions = find(
					list,
					(device: MediaDeviceInfo) => device.kind === 'audioinput'
				);
				if (firstAudioInputForPermissions) {
					getAudioAndVideo(
						{ deviceId: { exact: firstAudioInputForPermissions.deviceId } },
						videoStreamEnabled
					).then((stream: MediaStream) => {
						const tracks: MediaStreamTrack[] = stream.getTracks();
						tracks.forEach((track) => track.stop());
						updateListOfDevices();
					});
				}
			});
		} else {
			updateListOfDevices();
		}
	}, [audioStreamEnabled, updateListOfDevices, videoStreamEnabled]);

	useEffect(() => {
		navigator.mediaDevices.addEventListener('devicechange', updateListOfDevices);
		return (): void => {
			navigator.mediaDevices.removeEventListener('devicechange', updateListOfDevices);
		};
	}, [updateListOfDevices]);

	const toggleVideo = useCallback(() => {
		setEnterButtonIsEnabled(false);
		toggleStreams(
			audioStreamEnabled,
			!videoStreamEnabled,
			selectedAudioDevice,
			selectedVideoDevice
		);
	}, [
		toggleStreams,
		audioStreamEnabled,
		videoStreamEnabled,
		selectedAudioDevice,
		selectedVideoDevice
	]);

	const toggleAudio = useCallback(() => {
		setEnterButtonIsEnabled(false);
		toggleStreams(
			!audioStreamEnabled,
			videoStreamEnabled,
			selectedAudioDevice,
			selectedVideoDevice
		);
	}, [
		toggleStreams,
		audioStreamEnabled,
		videoStreamEnabled,
		selectedAudioDevice,
		selectedVideoDevice
	]);

	const onToggleAudioTest = useCallback(() => {
		setVideoPlayerTestMuted((prevState) => !prevState);
	}, []);

	const joinMeeting = useCallback(() => {
		MeetingsApi.enterMeeting(
			roomId,
			{ videoStreamEnabled, audioStreamEnabled },
			{ audioDevice: selectedAudioDevice, videoDevice: selectedVideoDevice }
		)
			.then((meetingId) => goToMeetingPage(meetingId))
			.catch((err) => console.error(err, 'Error on joinMeeting'));
	}, [
		roomId,
		videoStreamEnabled,
		audioStreamEnabled,
		selectedAudioDevice,
		selectedVideoDevice,
		goToMeetingPage
	]);

	const modalFooter = useMemo(
		() => (
			<Container mainAlignment="space-between" orientation="horizontal">
				<Button
					type="outlined"
					backgroundColor={'text'}
					label={videoPlayerTestMuted ? playMicLabel : stopMicLabel}
					onClick={onToggleAudioTest}
					disabled={!audioStreamEnabled}
				/>
				<Tooltip
					label={enterButtonDisabledTooltip}
					disabled={areNetworksUp && enterButtonIsEnabled}
				>
					<Button
						data-testid="enterMeetingButton"
						label={enter}
						onClick={joinMeeting}
						disabled={!(areNetworksUp && enterButtonIsEnabled)}
					/>
				</Tooltip>
			</Container>
		),
		[
			areNetworksUp,
			audioStreamEnabled,
			enter,
			enterButtonDisabledTooltip,
			enterButtonIsEnabled,
			joinMeeting,
			onToggleAudioTest,
			playMicLabel,
			stopMicLabel,
			videoPlayerTestMuted
		]
	);

	return (
		<CustomModal
			background={'gray0'}
			open
			size="small"
			showCloseIcon={false}
			title={modalTitle}
			customFooter={modalFooter}
		>
			<Padding top="small" />
			<Container
				padding={{ top: 'small' }}
				ref={wrapperRef}
				height="fit"
				width="fill"
				mainAlignment="flex-start"
			>
				<VideoTile width={wrapperWidth}>
					<Tile
						userId={memberId}
						meetingId={meeting?.id}
						modalProps={{
							streamRef: videoStreamRef,
							streamMuted: videoPlayerTestMuted,
							audioStreamEnabled,
							videoStreamEnabled
						}}
					/>
				</VideoTile>
				<Padding top="1rem" />
				<Text weight="bold">{joinMeetingDescription}</Text>
				<Container padding={{ top: '1rem' }} height="fit" width="fill" orientation={'horizontal'}>
					<Tooltip placement="top" label={videoStreamEnabled ? disableCamLabel : enableCamLabel}>
						<MultiButton
							primaryIcon={videoStreamEnabled ? 'Video' : 'VideoOff'}
							size="large"
							shape="round"
							background="primary"
							onClick={toggleVideo}
							dropdownProps={{
								width: 'fit',
								placement: 'bottom-end',
								items: mediaVideoList
							}}
							items={mediaVideoList}
						/>
					</Tooltip>
					<Padding left="1rem" />
					<Tooltip placement="top" label={audioStreamEnabled ? disableMicLabel : enableMicLabel}>
						<MultiButton
							primaryIcon={audioStreamEnabled ? 'Mic' : 'MicOff'}
							size="large"
							shape="round"
							background="primary"
							dropdownProps={{
								width: 'fit',
								placement: 'bottom-start',
								items: mediaAudioList
							}}
							onClick={toggleAudio}
							items={mediaAudioList}
						/>
					</Tooltip>
				</Container>
				<Padding bottom="1rem" />
				<Text size="small">{setInputDescription}</Text>
				<Padding bottom="1rem" />
			</Container>
		</CustomModal>
	);
};

export default AccessMeetingModal;
