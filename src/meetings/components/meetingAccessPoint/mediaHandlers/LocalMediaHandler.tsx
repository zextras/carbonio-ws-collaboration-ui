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

import { Container, IconButton, Padding, Select, Tooltip } from '@zextras/carbonio-design-system';
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
};

const LocalMediaHandler: FC<LocalMediaHandlerProps> = ({
	streamTrack,
	setStreamTrack,
	setEnterButtonIsEnabled,
	selectedDevicesId,
	setSelectedDevicesId,
	mediaDevicesEnabled,
	setMediaDevicesEnabled
}) => {
	const [t] = useTranslation();
	const disableCamLabel = t('meeting.interactions.disableCamera', 'Disable camera');
	const enableCamLabel = t('meeting.interactions.enableCamera', 'Enable camera');
	const disableMicLabel = t('meeting.interactions.disableMicrophone', 'Disable microphone');
	const enableMicLabel = t('meeting.interactions.enableMicrophone', 'Enable microphone');
	const camDeviceLabel = t('meeting.interactions.camDevice', 'Camera device');
	const micDeviceLabel = t('meeting.interactions.micDevice', 'Microphone device');

	const [audioMediaList, setAudioMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	const [videoMediaList, setVideoMediaList] = useState<[] | MediaDeviceInfo[]>([]);

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
		(videoItem) => {
			if (mediaDevicesEnabled.video) {
				setEnterButtonIsEnabled(false);
				toggleStreams(mediaDevicesEnabled.audio, true, selectedDevicesId.audio, videoItem);
			}
			setSelectedDevicesId({ audio: selectedDevicesId.audio, video: videoItem });
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
		(audioItem) => {
			if (mediaDevicesEnabled.audio) {
				setEnterButtonIsEnabled(false);
				toggleStreams(true, mediaDevicesEnabled.video, audioItem, selectedDevicesId.video);
			}
			setSelectedDevicesId({ audio: audioItem, video: selectedDevicesId.video });
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
		[setEnterButtonIsEnabled, toggleStreams, mediaDevicesEnabled, selectedDevicesId]
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
		[setEnterButtonIsEnabled, toggleStreams, mediaDevicesEnabled, selectedDevicesId]
	);

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
	}, [mediaDevicesEnabled, updateListOfDevices]);

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
					<IconButton
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
					<IconButton
						icon={mediaDevicesEnabled.audio ? 'Mic' : 'MicOff'}
						size="extralarge"
						backgroundColor={'primary'}
						onClick={toggleAudio}
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
