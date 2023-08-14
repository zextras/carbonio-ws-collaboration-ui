/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useRouting, { PAGE_INFO_TYPE } from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import { PeerConnConfig } from '../../network/webRTC/PeerConnConfig';
import { getMeeting } from '../../store/selectors/MeetingSelectors';
import { getRoomNameSelector, getRoomTypeSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
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

const VideoEl = styled.video`
	min-width: 100%;
	max-width: 100%;
`;

const CustomModal = styled(Modal)`
	cursor: default;
	user-select: none;
`;

const AccessMeetingModal = ({ roomId }: AccessMeetingModalProps): ReactElement => {
	const [t] = useTranslation();
	const enter = t('action.enter', 'Enter');
	const disableAudioLabel = t('meeting.interactions.disableAudio', 'Disable Audio');
	const enableAudioLabel = t('meeting.interactions.enableAudio', 'Enable Audio');
	const disableVideoLabel = t('meeting.interactions.disableVideo', 'Disable Video');
	const enableVideoLabel = t('meeting.interactions.enableVideo', 'Enable Video');
	const playMicLabel = t('meeting.interactions.playMic', 'Start microphone testing');
	const stopMicLabel = t('meeting.interactions.stopMic', 'Stop microphone testing');
	const closeModalTooltip = t('action.close', 'Close');
	const joinMeetingDescription = t(
		'meeting.joinMeetingDescription',
		'How do you want to join this meeting?'
	);
	const setInputDescription = t(
		'meeting.setInputDescription',
		'Set your input devices by choosing them from dropdown menu'
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

	const { goToMeetingPage, goToInfoPage } = useRouting();

	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const meeting = useStore((store) => getMeeting(store, roomId));
	const addMeeting = useStore((store) => store.addMeeting);
	const setSelectedDeviceId = useStore((store) => store.setSelectedDeviceId);
	const createBidirectionalAudioConn = useStore((store) => store.createBidirectionalAudioConn);
	const createVideoOutConn = useStore((store) => store.createVideoOutConn);
	// const createVideoInConn = useStore((store) => store.createVideoInConn);

	const [videoStreamEnabled, setVideoStreamEnabled] = useState(false);
	const [audioStreamEnabled, setAudioStreamEnabled] = useState(false);
	const [audioMediaList, setAudioMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	const [videoMediaList, setVideoMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	const [selectedAudioStream, setSelectedAudioStream] = useState('');
	const [selectedVideoStream, setSelectedVideoStream] = useState('');
	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [wrapperWidth, setWrapperWidth] = useState(0);
	const [videoPlayerTestMuted, setVideoPlayerTestMuted] = useState(true);

	const wrapperRef = useRef<HTMLDivElement>();
	const videoStreamRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (wrapperRef.current) setWrapperWidth(wrapperRef.current.offsetWidth);
	}, [wrapperRef]);

	useEffect(() => {
		if (videoStreamRef.current) {
			videoStreamRef.current.srcObject = streamTrack;
		}
	}, [streamTrack, audioStreamEnabled, videoStreamEnabled]);

	const modalTitle = useMemo(
		() => (roomType === RoomType.ONE_TO_ONE ? oneToOneTitle : groupTitle),
		[groupTitle, oneToOneTitle, roomType]
	);

	const toggleStreams = useCallback(
		(audio: boolean, video: boolean, audioId: string, videoId: string) => {
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
						setSelectedVideoStream(videoId);
						setSelectedAudioStream(audioId);
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
					toggleStreams(audioStreamEnabled, true, selectedAudioStream, videoItem.deviceId);
				},
				selected: videoItem.deviceId === selectedVideoStream,
				value: videoItem.deviceId
			})),
		[audioStreamEnabled, selectedAudioStream, selectedVideoStream, toggleStreams, videoMediaList]
	);

	const mediaAudioList = useMemo(
		() =>
			map(audioMediaList, (audioItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: audioItem.label ? audioItem.label : `device-${i}`,
				onClick: (): void => {
					toggleStreams(true, videoStreamEnabled, audioItem.deviceId, selectedVideoStream);
				},
				selected: audioItem.deviceId === selectedAudioStream,
				value: audioItem.deviceId
			})),
		[audioMediaList, selectedAudioStream, selectedVideoStream, toggleStreams, videoStreamEnabled]
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
		toggleStreams(
			audioStreamEnabled,
			!videoStreamEnabled,
			selectedAudioStream,
			selectedVideoStream
		);
	}, [
		toggleStreams,
		audioStreamEnabled,
		videoStreamEnabled,
		selectedAudioStream,
		selectedVideoStream
	]);

	const toggleAudio = useCallback(() => {
		toggleStreams(
			!audioStreamEnabled,
			videoStreamEnabled,
			selectedAudioStream,
			selectedVideoStream
		);
	}, [
		toggleStreams,
		audioStreamEnabled,
		videoStreamEnabled,
		selectedAudioStream,
		selectedVideoStream
	]);

	const onToggleAudioTest = useCallback(() => {
		setVideoPlayerTestMuted((prevState) => !prevState);
	}, []);

	const onCloseHandler = useCallback(() => {
		goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
	}, [goToInfoPage]);

	const redirectToMeetingAndInitWebRTC = useCallback(
		(meetingId: string): void => {
			const peerConnectionConfig = new PeerConnConfig();
			createBidirectionalAudioConn(
				meetingId,
				peerConnectionConfig,
				audioStreamEnabled,
				selectedAudioStream
			);
			setSelectedDeviceId(meetingId, STREAM_TYPE.AUDIO, selectedAudioStream);
			// createVideoInConn(meetingId, peerConnectionConfig);
			if (videoStreamEnabled) {
				createVideoOutConn(meetingId, peerConnectionConfig);
				setSelectedDeviceId(meetingId, STREAM_TYPE.VIDEO, selectedVideoStream);
			}
			goToMeetingPage(meetingId);
		},
		[
			createBidirectionalAudioConn,
			audioStreamEnabled,
			setSelectedDeviceId,
			selectedAudioStream,
			videoStreamEnabled,
			goToMeetingPage,
			createVideoOutConn,
			selectedVideoStream
		]
	);

	const joinMeeting = useCallback(() => {
		const join = (meetingId: string): Promise<void> =>
			MeetingsApi.joinMeeting(meetingId, { videoStreamEnabled, audioStreamEnabled })
				.then(() => {
					redirectToMeetingAndInitWebRTC(meetingId);
				})
				.catch((err) => console.error(err, 'Error on joinMeeting'));
		const start = (meetingId: string): Promise<void> =>
			MeetingsApi.startMeeting(meetingId)
				.then(() => {
					join(meetingId);
				})
				.catch((err) => console.error(err, 'Error on startMeeting'));

		if (meeting) {
			if (meeting.active) {
				// If meeting is already active, just join it
				join(meeting.id);
			} else {
				// If meeting is not active, start it and then join it
				start(meeting.id);
			}
		} else {
			// If meeting doesn't exist, create it, start it and then join it
			MeetingsApi.createPermanentMeeting(roomId)
				.then((response) => {
					addMeeting(response);
					start(response.id);
				})
				.catch((err) => console.log(err, 'Error on create-join'));
		}
	}, [
		meeting,
		videoStreamEnabled,
		audioStreamEnabled,
		redirectToMeetingAndInitWebRTC,
		roomId,
		addMeeting
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
				<Button label={enter} onClick={joinMeeting} />
			</Container>
		),
		[
			audioStreamEnabled,
			enter,
			joinMeeting,
			onToggleAudioTest,
			playMicLabel,
			stopMicLabel,
			videoPlayerTestMuted
		]
	);

	return (
		<CustomModal
			background={'text'}
			open
			size="small"
			title={modalTitle}
			showCloseIcon
			onClose={onCloseHandler}
			closeIconTooltip={closeModalTooltip}
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
					<VideoEl
						playsInline
						autoPlay
						muted={videoPlayerTestMuted}
						controls={false}
						ref={videoStreamRef}
					/>
				</VideoTile>
				<Padding top="1rem" />
				<Text weight="bold">{joinMeetingDescription}</Text>
				<Container
					padding={{ top: '1rem' }}
					ref={wrapperRef}
					height="fit"
					width="fill"
					orientation={'horizontal'}
				>
					<Tooltip
						placement="top"
						label={videoStreamEnabled ? disableVideoLabel : enableVideoLabel}
					>
						<MultiButton
							primaryIcon={videoStreamEnabled ? 'Video' : 'VideoOff'}
							size="large"
							width="5rem"
							shape="round"
							iconColor="gray6"
							backgroundColor="primary"
							onClick={toggleVideo}
							dropdownProps={{ width: 'fit', placement: 'bottom-end' }}
							items={mediaVideoList}
						/>
					</Tooltip>
					<Padding left="1rem" />
					<Tooltip
						placement="top"
						label={audioStreamEnabled ? disableAudioLabel : enableAudioLabel}
					>
						<MultiButton
							primaryIcon={audioStreamEnabled ? 'Mic' : 'MicOff'}
							size="large"
							shape="round"
							width="5rem"
							iconColor="gray6"
							backgroundColor="primary"
							dropdownProps={{ width: 'fit', placement: 'bottom-start' }}
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
