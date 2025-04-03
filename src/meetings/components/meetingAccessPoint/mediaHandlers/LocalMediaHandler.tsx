/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo } from 'react';

import { Button, Container, Select, Snackbar, Tooltip } from '@zextras/carbonio-design-system';
import { find, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import useBrowserPermission from '../../../../hooks/useMediaDevices';
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
	const camDeviceLabel = t('interactions.camDevice', 'Camera device');
	const micDeviceLabel = t('interactions.micDevice', 'Microphone device');
	const giveMediaPermissionSnackbar = t(
		'meeting.interactions.browserPermission',
		'Grant browser permissions to enable resources'
	);
	const unknownDeviceLabel = t('meeting.interactions.unknownDevice', 'Unknown device');
	const noDevicesLabel = t('meeting.interactions.noDevices', 'No devices available');

	const {
		permission: audioPermission,
		deviceList: audioMediaList,
		noDevices: noAudioDevices
	} = useBrowserPermission('audio');
	const {
		permission: videoPermission,
		deviceList: videoMediaList,
		noDevices: noVideoDevices
	} = useBrowserPermission('video');

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
				label: videoItem.label ? videoItem.label : unknownDeviceLabel,
				value: videoItem.deviceId
			})),
		[unknownDeviceLabel, videoMediaList]
	);

	const mediaAudioList: { id: string; label: string; value: string }[] = useMemo(
		() =>
			map(audioMediaList, (audioItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: audioItem.label ? audioItem.label : unknownDeviceLabel,
				value: audioItem.deviceId
			})),
		[audioMediaList, unknownDeviceLabel]
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
		if (mediaDevicesEnabled.audio || mediaDevicesEnabled.video) {
			getAudioAndVideo(mediaDevicesEnabled.audio, mediaDevicesEnabled.video).then((stream) => {
				setStreamTrack(stream);
			});
		}
		// this useEffect should run just once and only at the beginning
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (selectedDevicesId.audio === undefined && mediaAudioList[0]) {
			setSelectedDevicesId({ audio: mediaAudioList[0].value, video: selectedDevicesId.video });
		}
	}, [mediaAudioList, selectedDevicesId, setSelectedDevicesId]);

	useEffect(() => {
		if (mediaDevicesEnabled.video && videoPermission === 'denied') {
			toggleStreams(mediaDevicesEnabled.audio, false, selectedDevicesId.audio, undefined);
		}
		if (mediaDevicesEnabled.audio && audioPermission === 'denied') {
			toggleStreams(false, mediaDevicesEnabled.video, undefined, selectedDevicesId.video);
		}
	}, [
		audioPermission,
		mediaDevicesEnabled.audio,
		mediaDevicesEnabled.video,
		noAudioDevices,
		noVideoDevices,
		selectedDevicesId.audio,
		selectedDevicesId.video,
		toggleStreams,
		videoPermission
	]);

	const audioTooltip = useMemo(() => {
		if (audioPermission !== 'granted') return giveMediaPermissionSnackbar;
		return mediaDevicesEnabled.audio ? disableMicLabel : enableMicLabel;
	}, [
		audioPermission,
		giveMediaPermissionSnackbar,
		mediaDevicesEnabled.audio,
		disableMicLabel,
		enableMicLabel
	]);

	const videoTooltip = useMemo(() => {
		if (videoPermission !== 'granted') return giveMediaPermissionSnackbar;
		return mediaDevicesEnabled.video ? disableCamLabel : enableCamLabel;
	}, [
		videoPermission,
		giveMediaPermissionSnackbar,
		mediaDevicesEnabled.video,
		disableCamLabel,
		enableCamLabel
	]);

	return (
		<Container height="fit" width="100%" gap="1rem">
			<Container height="fit" orientation={'horizontal'} gap="1rem" crossAlignment="flex-start">
				<Tooltip placement="top" label={videoTooltip}>
					<Button
						icon={mediaDevicesEnabled.video ? 'Video' : 'VideoOff'}
						size="extralarge"
						backgroundColor={'primary'}
						onClick={toggleVideo}
						disabled={videoPermission !== 'granted' || noVideoDevices}
					/>
				</Tooltip>
				<Select
					label={noVideoDevices ? noDevicesLabel : camDeviceLabel}
					data-testid={'camera-select'}
					items={mediaVideoList}
					onChange={onChangeVideoSource}
					selection={videoSelected}
					multiple={false}
					placement="bottom-end"
					showCheckbox={false}
					background={'text'}
					disablePortal
					disabled={videoPermission !== 'granted' || noVideoDevices}
				/>
			</Container>
			<Container height="fit" orientation={'horizontal'} gap="1rem" crossAlignment="flex-start">
				<Tooltip placement="top" label={audioTooltip}>
					<Button
						icon={mediaDevicesEnabled.audio ? 'Mic' : 'MicOff'}
						size="extralarge"
						backgroundColor={'primary'}
						onClick={toggleAudio}
						data-testid={'turn_on_audio'}
						disabled={audioPermission !== 'granted' || noAudioDevices}
					/>
				</Tooltip>
				<Select
					label={noAudioDevices ? noDevicesLabel : micDeviceLabel}
					data-testid={'audio-select'}
					items={mediaAudioList}
					onChange={onChangeAudioSource}
					selection={audioSelected}
					multiple={false}
					placement="bottom-end"
					showCheckbox={false}
					background={'text'}
					disablePortal
					disabled={audioPermission !== 'granted' || noAudioDevices}
				/>
			</Container>
			{(audioPermission === 'denied' || videoPermission === 'denied') && (
				<Snackbar
					open={audioPermission === 'denied' || videoPermission === 'denied'}
					disableAutoHide
					severity="info"
					label={giveMediaPermissionSnackbar}
					hideButton
				/>
			)}
		</Container>
	);
};

export default LocalMediaHandler;
