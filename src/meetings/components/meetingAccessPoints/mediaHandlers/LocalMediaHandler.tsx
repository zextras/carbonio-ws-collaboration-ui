/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	Dispatch,
	FC,
	RefObject,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import { Container, MultiButton, Padding, Tooltip } from '@zextras/carbonio-design-system';
import { filter, find, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { BrowserUtils } from '../../../../utils/BrowserUtils';
import { freeMediaResources } from '../../../../utils/MeetingsUtils';
import { getAudioAndVideo } from '../../../../utils/UserMediaManager';

type LocalMediaHandlerProps = {
	streamTrack: MediaStream | null;
	setStreamTrack: Dispatch<SetStateAction<MediaStream | null>>;
	setEnterButtonIsEnabled: Dispatch<SetStateAction<boolean>>;
	selectedDevicesId: { audio: string | undefined; video: string | undefined };
	setSelectedDevicesId: Dispatch<
		SetStateAction<{ audio: string | undefined; video: string | undefined }>
	>;
	mediaDevicesEnabled: { audio: boolean; video: boolean };
	setMediaDevicesEnabled: Dispatch<SetStateAction<{ audio: boolean; video: boolean }>>;
	meetingAccessRef: RefObject<HTMLDivElement>;
};

const LocalMediaHandler: FC<LocalMediaHandlerProps> = ({
	streamTrack,
	setStreamTrack,
	setEnterButtonIsEnabled,
	selectedDevicesId,
	setSelectedDevicesId,
	mediaDevicesEnabled,
	setMediaDevicesEnabled,
	meetingAccessRef
}) => {
	const [t] = useTranslation();
	const disableCamLabel = t('meeting.interactions.disableCamera', 'Disable camera');
	const enableCamLabel = t('meeting.interactions.enableCamera', 'Enable camera');
	const disableMicLabel = t('meeting.interactions.disableMicrophone', 'Disable microphone');
	const enableMicLabel = t('meeting.interactions.enableMicrophone', 'Enable microphone');

	const [audioMediaList, setAudioMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	const [videoMediaList, setVideoMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	const [audioListOpen, setAudioListOpen] = useState<boolean>(false);
	const [videoListOpen, setVideoListOpen] = useState<boolean>(false);

	const audioDropdownRef = useRef<HTMLDivElement>(null);
	const videoDropdownRef = useRef<HTMLDivElement>(null);

	const toggleStreams = useCallback(
		(audio: boolean, video: boolean, audioId: string | undefined, videoId: string | undefined) => {
			freeMediaResources(streamTrack);

			if (!audio && !video) {
				getAudioAndVideo(true, false).then((stream: MediaStream) => {
					const tracks = stream.getTracks();
					tracks.forEach((track) => track.stop());
					setStreamTrack(stream);
					setMediaDevicesEnabled({ audio, video });
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
						setMediaDevicesEnabled({ audio, video });
						setSelectedDevicesId({ audio: audioId, video: videoId });
						setEnterButtonIsEnabled(true);
					})
					.catch((e) => console.error(e));
			}
		},
		[
			setEnterButtonIsEnabled,
			setMediaDevicesEnabled,
			setSelectedDevicesId,
			setStreamTrack,
			streamTrack
		]
	);

	useEffect(() => {
		toggleStreams(
			mediaDevicesEnabled.audio,
			mediaDevicesEnabled.video,
			selectedDevicesId.audio,
			selectedDevicesId.video
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const mediaVideoList = useMemo(
		() =>
			map(videoMediaList, (videoItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: videoItem.label ? videoItem.label : `device-${i}`,
				onClick: (): void => {
					if (mediaDevicesEnabled.video) {
						setEnterButtonIsEnabled(false);
						toggleStreams(
							mediaDevicesEnabled.audio,
							true,
							selectedDevicesId.audio,
							videoItem.deviceId
						);
					} else {
						setSelectedDevicesId({ audio: selectedDevicesId.audio, video: videoItem.deviceId });
					}
				},
				selected: videoItem.deviceId === selectedDevicesId.video,
				value: videoItem.deviceId
			})),
		[
			mediaDevicesEnabled.audio,
			mediaDevicesEnabled.video,
			selectedDevicesId.audio,
			selectedDevicesId.video,
			setEnterButtonIsEnabled,
			setSelectedDevicesId,
			toggleStreams,
			videoMediaList
		]
	);

	const mediaAudioList = useMemo(
		() =>
			map(audioMediaList, (audioItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: audioItem.label ? audioItem.label : `device-${i}`,
				onClick: (): void => {
					if (mediaDevicesEnabled.audio) {
						setEnterButtonIsEnabled(false);
						toggleStreams(
							true,
							mediaDevicesEnabled.video,
							audioItem.deviceId,
							selectedDevicesId.video
						);
					} else {
						setSelectedDevicesId({ audio: audioItem.deviceId, video: selectedDevicesId.video });
					}
				},
				selected: audioItem.deviceId === selectedDevicesId.audio,
				value: audioItem.deviceId
			})),
		[
			audioMediaList,
			mediaDevicesEnabled.audio,
			mediaDevicesEnabled.video,
			selectedDevicesId.audio,
			selectedDevicesId.video,
			setEnterButtonIsEnabled,
			setSelectedDevicesId,
			toggleStreams
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

	const toggleVideo = useCallback(
		(event) => {
			event.stopPropagation();
			setEnterButtonIsEnabled(false);
			toggleStreams(
				mediaDevicesEnabled.audio,
				!mediaDevicesEnabled.video,
				selectedDevicesId.audio,
				selectedDevicesId.video
			);
		},
		[
			setEnterButtonIsEnabled,
			toggleStreams,
			mediaDevicesEnabled.audio,
			mediaDevicesEnabled.video,
			selectedDevicesId.audio,
			selectedDevicesId.video
		]
	);

	const toggleAudio = useCallback(
		(event) => {
			event.stopPropagation();
			setEnterButtonIsEnabled(false);
			toggleStreams(
				!mediaDevicesEnabled.audio,
				mediaDevicesEnabled.video,
				selectedDevicesId.audio,
				selectedDevicesId.video
			);
		},
		[
			setEnterButtonIsEnabled,
			toggleStreams,
			mediaDevicesEnabled.audio,
			mediaDevicesEnabled.video,
			selectedDevicesId.audio,
			selectedDevicesId.video
		]
	);

	const toggleAudioDropdown = useCallback(() => {
		setAudioListOpen((prevState) => !prevState);
	}, [setAudioListOpen]);

	const toggleVideoDropdown = useCallback(() => {
		setVideoListOpen((prevState) => !prevState);
	}, [setVideoListOpen]);

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
						mediaDevicesEnabled.video
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
	}, [mediaDevicesEnabled.audio, updateListOfDevices, mediaDevicesEnabled.video]);

	useEffect(() => {
		navigator.mediaDevices.addEventListener('devicechange', updateListOfDevices);
		return (): void => {
			navigator.mediaDevices.removeEventListener('devicechange', updateListOfDevices);
		};
	}, [updateListOfDevices]);

	const handleClickOutsideAudioDropdown = useCallback((e) => {
		if (audioDropdownRef.current && !audioDropdownRef.current.contains(e.target)) {
			setAudioListOpen(false);
		}
	}, []);

	const handleClickOutsideVideoDropdown = useCallback((e) => {
		if (videoDropdownRef.current && !videoDropdownRef.current.contains(e.target)) {
			setVideoListOpen(false);
		}
	}, []);

	useEffect(() => {
		let elRef: React.RefObject<HTMLDivElement> | null = meetingAccessRef;
		if (elRef?.current) {
			if (audioListOpen) {
				elRef.current.addEventListener('mousedown', handleClickOutsideAudioDropdown);
			}
			if (videoListOpen) {
				elRef.current.addEventListener('mousedown', handleClickOutsideVideoDropdown);
			}
		}

		return (): void => {
			if (elRef?.current) {
				elRef.current.removeEventListener('mousedown', handleClickOutsideAudioDropdown);
				elRef.current.addEventListener('mousedown', handleClickOutsideVideoDropdown);

				elRef = null;
			}
		};
	}, [
		audioListOpen,
		handleClickOutsideAudioDropdown,
		handleClickOutsideVideoDropdown,
		meetingAccessRef,
		videoListOpen
	]);

	return (
		<Container height="fit" width="fit" orientation={'horizontal'}>
			<Tooltip placement="top" label={mediaDevicesEnabled.video ? disableCamLabel : enableCamLabel}>
				<MultiButton
					primaryIcon={mediaDevicesEnabled.video ? 'Video' : 'VideoOff'}
					icon={videoListOpen ? 'ChevronUpOutline' : 'ChevronDownOutline'}
					size="large"
					shape="round"
					background={'primary'}
					onClick={toggleVideo}
					dropdownProps={{
						forceOpen: videoListOpen,
						onClick: toggleVideoDropdown,
						width: 'fit',
						placement: 'bottom-end',
						items: mediaVideoList,
						dropdownListRef: videoDropdownRef
					}}
					items={mediaVideoList}
				/>
			</Tooltip>
			<Padding left="1rem" />
			<Tooltip placement="top" label={mediaDevicesEnabled.audio ? disableMicLabel : enableMicLabel}>
				<MultiButton
					primaryIcon={mediaDevicesEnabled.audio ? 'Mic' : 'MicOff'}
					icon={audioListOpen ? 'ChevronUpOutline' : 'ChevronDownOutline'}
					size="large"
					shape="round"
					background={'primary'}
					dropdownProps={{
						forceOpen: audioListOpen,
						onClick: toggleAudioDropdown,
						width: 'fit',
						placement: 'bottom-start',
						items: mediaAudioList,
						dropdownListRef: audioDropdownRef
					}}
					onClick={toggleAudio}
					items={mediaAudioList}
				/>
			</Tooltip>
		</Container>
	);
};

export default LocalMediaHandler;
