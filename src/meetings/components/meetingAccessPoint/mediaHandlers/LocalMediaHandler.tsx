/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';

import {
	Button,
	Container,
	CreateSnackbarFn,
	Padding,
	Select,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { filter, find, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { BrowserUtils } from '../../../../utils/BrowserUtils';
import { MeetingStorageType } from '../../../../utils/localStorageUtils';
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
	setMeetingStorage: Dispatch<SetStateAction<MeetingStorageType>>;
};

const LocalMediaHandler: FC<LocalMediaHandlerProps> = ({
	streamTrack,
	setStreamTrack,
	setEnterButtonIsEnabled,
	selectedDevicesId,
	setSelectedDevicesId,
	mediaDevicesEnabled,
	setMediaDevicesEnabled,
	setMeetingStorage
}) => {
	const [t] = useTranslation();
	const disableCamLabel = t('meeting.interactions.disableCamera', 'Disable camera');
	const enableCamLabel = t('meeting.interactions.enableCamera', 'Enable camera');
	const disableMicLabel = t('meeting.interactions.disableMicrophone', 'Disable microphone');
	const enableMicLabel = t('meeting.interactions.enableMicrophone', 'Enable microphone');
	const camDeviceLabel = t('meeting.interactions.camDevice', 'Camera device');
	const micDeviceLabel = t('meeting.interactions.micDevice', 'Microphone device');
	const understoodAction = t('action.understood', 'UNDERSTOOD');
	const giveMediaPermissionSnackbar = t(
		'meeting.interactions.browserPermission',
		'Grant browser permissions to enable resources'
	);

	const [audioMediaList, setAudioMediaList] = useState<[] | MediaDeviceInfo[]>([]);
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

	const toggleStreams = useCallback(
		(audio: boolean, video: boolean, audioId: string | undefined, videoId: string | undefined) => {
			freeMediaResources(streamTrack);
			if (audio || video) {
				const kindOfAudioDevice = audioId
					? {
							deviceId: { exact: audioId },
							noiseSuppression: true,
							echoCancellation: true
						}
					: { noiseSuppression: true, echoCancellation: true };
				const kindOfVideoDevice = videoId ? { deviceId: { exact: videoId } } : true;
				getAudioAndVideo(audio ? kindOfAudioDevice : false, video ? kindOfVideoDevice : false)
					.then((stream: MediaStream) => {
						setStreamTrack(stream);
						setMediaDevicesEnabled({ audio, video });
						setMeetingStorage({ EnableCamera: video, EnableMicrophone: audio });
						setSelectedDevicesId({ audio: audioId, video: videoId });
						setEnterButtonIsEnabled(true);
					})
					.catch((e): void => {
						mediaPermissionSnackbar();
						setEnterButtonIsEnabled(true);
						console.error(e);
					});
			} else {
				setStreamTrack(null);
				setMeetingStorage({ EnableCamera: video, EnableMicrophone: audio });
				setMediaDevicesEnabled({ audio, video });
				setEnterButtonIsEnabled(true);
			}
		},
		[
			mediaPermissionSnackbar,
			setEnterButtonIsEnabled,
			setMediaDevicesEnabled,
			setMeetingStorage,
			setSelectedDevicesId,
			setStreamTrack,
			streamTrack
		]
	);

	const mediaVideoList: { id: string; label: string; value: string }[] = useMemo(
		() =>
			map(videoMediaList, (videoItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: videoItem.label ? videoItem.label : `device-${i}`,
				value: videoItem.deviceId
			})),
		[videoMediaList]
	);

	const mediaAudioList: { id: string; label: string; value: string }[] = useMemo(
		() =>
			map(audioMediaList, (audioItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: audioItem.label ? audioItem.label : `device-${i}`,
				value: audioItem.deviceId
			})),
		[audioMediaList]
	);

	const onChangeVideoSource = useCallback(
		(videoItem: string | null) => {
			if (mediaDevicesEnabled.video) {
				setEnterButtonIsEnabled(false);
				toggleStreams(mediaDevicesEnabled.audio, true, selectedDevicesId.audio, videoItem ?? '');
			}
			setSelectedDevicesId({ audio: selectedDevicesId.audio, video: videoItem ?? '' });
		},
		[
			mediaDevicesEnabled,
			selectedDevicesId.audio,
			setEnterButtonIsEnabled,
			setSelectedDevicesId,
			toggleStreams
		]
	);

	const onChangeAudioSource = useCallback(
		(audioItem: string | null) => {
			if (mediaDevicesEnabled.audio) {
				setEnterButtonIsEnabled(false);
				toggleStreams(true, mediaDevicesEnabled.video, audioItem ?? '', selectedDevicesId.video);
			}
			setSelectedDevicesId({ audio: audioItem ?? '', video: selectedDevicesId.video });
		},
		[
			mediaDevicesEnabled,
			selectedDevicesId.video,
			setEnterButtonIsEnabled,
			setSelectedDevicesId,
			toggleStreams
		]
	);

	const videoSelected = useMemo(
		() => find(mediaVideoList, ['value', selectedDevicesId.video]) ?? mediaVideoList[0],
		[mediaVideoList, selectedDevicesId.video]
	);

	const audioSelected = useMemo(
		() => find(mediaAudioList, ['value', selectedDevicesId.audio]) ?? mediaAudioList[0],
		[mediaAudioList, selectedDevicesId.audio]
	);

	const updateListOfDevices = useCallback(() => {
		navigator.mediaDevices
			.enumerateDevices()
			.then((devices) => {
				const audioInputs = filter(
					devices,
					(device: MediaDeviceInfo) => device.kind === 'audioinput' && device
				) as MediaDeviceInfo[];
				const videoInputs = filter(
					devices,
					(device: MediaDeviceInfo) => device.kind === 'videoinput' && device
				) as MediaDeviceInfo[];
				setAudioMediaList(audioInputs);
				setVideoMediaList(videoInputs);
			})
			.catch((e) => {
				console.log(e);
			});
	}, []);

	const toggleVideo = useCallback(
		(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			event.stopPropagation();
			setEnterButtonIsEnabled(false);
			toggleStreams(
				mediaDevicesEnabled.audio,
				!mediaDevicesEnabled.video,
				selectedDevicesId.audio,
				selectedDevicesId.video
			);
		},
		[setEnterButtonIsEnabled, toggleStreams, mediaDevicesEnabled, selectedDevicesId]
	);

	const toggleAudio = useCallback(
		(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			event.stopPropagation();
			setEnterButtonIsEnabled(false);
			toggleStreams(
				!mediaDevicesEnabled.audio,
				mediaDevicesEnabled.video,
				selectedDevicesId.audio,
				selectedDevicesId.video
			);
		},
		[setEnterButtonIsEnabled, toggleStreams, mediaDevicesEnabled, selectedDevicesId]
	);

	useEffect(() => {
		if (BrowserUtils.isFirefox()) {
			navigator.mediaDevices
				.enumerateDevices()
				.then((list) => {
					const firstAudioInputForPermissions = find(
						list,
						(device: MediaDeviceInfo) => device.kind === 'audioinput'
					);
					if (firstAudioInputForPermissions) {
						getAudioAndVideo(
							{ deviceId: { exact: firstAudioInputForPermissions.deviceId } },
							mediaDevicesEnabled.video
						)
							.then((stream: MediaStream) => {
								const tracks: MediaStreamTrack[] = stream.getTracks();
								tracks.forEach((track) => track.stop());
								updateListOfDevices();
							})
							.catch((e) => {
								console.log(e);
							});
					}
				})
				.catch((e) => {
					console.log(e);
				});
		} else {
			updateListOfDevices();
		}
	}, [
		createSnackbar,
		giveMediaPermissionSnackbar,
		mediaDevicesEnabled,
		understoodAction,
		updateListOfDevices
	]);

	useEffect(() => {
		if (mediaDevicesEnabled.audio || mediaDevicesEnabled.video) {
			getAudioAndVideo(mediaDevicesEnabled.audio, mediaDevicesEnabled.video).then((stream) => {
				setStreamTrack(stream);
			});
		}
		// this useEffect should run just once and only at the beginning
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		navigator.mediaDevices.addEventListener('devicechange', updateListOfDevices);
		return (): void => {
			navigator.mediaDevices.removeEventListener('devicechange', updateListOfDevices);
		};
	}, [updateListOfDevices]);

	return (
		<Container height="fit" width="100%">
			<Container height="fit" orientation={'horizontal'}>
				<Tooltip
					placement="top"
					label={mediaDevicesEnabled.video ? disableCamLabel : enableCamLabel}
				>
					<Button
						icon={mediaDevicesEnabled.video ? 'Video' : 'VideoOff'}
						size="extralarge"
						backgroundColor={'primary'}
						onClick={toggleVideo}
					/>
				</Tooltip>
				<Padding left="1rem" />
				<Select
					label={camDeviceLabel}
					data-testid={'camera-select'}
					items={mediaVideoList}
					onChange={onChangeVideoSource}
					selection={videoSelected}
					multiple={false}
					placement="bottom-end"
					showCheckbox={false}
					background={'text'}
					disablePortal
				/>
			</Container>
			<Padding bottom="1rem" />
			<Container height="fit" orientation={'horizontal'}>
				<Tooltip
					placement="top"
					label={mediaDevicesEnabled.audio ? disableMicLabel : enableMicLabel}
				>
					<Button
						icon={mediaDevicesEnabled.audio ? 'Mic' : 'MicOff'}
						size="extralarge"
						backgroundColor={'primary'}
						onClick={toggleAudio}
						data-testid={'turn_on_audio'}
					/>
				</Tooltip>
				<Padding left="1rem" />
				<Select
					label={micDeviceLabel}
					data-testid={'audio-select'}
					items={mediaAudioList}
					onChange={onChangeAudioSource}
					selection={audioSelected}
					multiple={false}
					placement="bottom-end"
					showCheckbox={false}
					background={'text'}
					disablePortal
				/>
			</Container>
		</Container>
	);
};

export default LocalMediaHandler;
