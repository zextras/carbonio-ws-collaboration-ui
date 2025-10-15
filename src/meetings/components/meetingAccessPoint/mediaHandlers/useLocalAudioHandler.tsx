/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Container, Row, Select, Snackbar, Tooltip } from '@zextras/carbonio-design-system';
import { find, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import useBrowserPermission from '../../../../hooks/useMediaDevices';
import { freeMediaResources } from '../../../../utils/MeetingsUtils';
import { getAudioStream } from '../../../../utils/UserMediaManager';

type UseLocalMediaHandlerParams = {
	initialStatus: boolean;
	streamRef: React.RefObject<HTMLAudioElement>;
};

type UseLocalMediaHandlerReturn = {
	AudioHandlerComponent: React.ReactElement;
	audioStatus: boolean;
	audioDeviceId: string | undefined;
};

export const useLocalAudioHandler = ({
	initialStatus,
	streamRef
}: UseLocalMediaHandlerParams): UseLocalMediaHandlerReturn => {
	const [t] = useTranslation();
	const disableMicLabel = t('meeting.interactions.disableMicrophone', 'Disable microphone');
	const enableMicLabel = t('meeting.interactions.enableMicrophone', 'Enable microphone');
	const micDeviceLabel = t('interactions.micDevice', 'Microphone device');
	const giveMediaPermissionSnackbar = t(
		'meeting.interactions.browserPermission',
		'Grant browser permissions to enable resources'
	);
	const unknownDeviceLabel = t('meeting.interactions.unknownDevice', 'Unknown device');
	const noDevicesLabel = t('meeting.interactions.noDevices', 'No devices available');

	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [status, setStatus] = useState(initialStatus);
	const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

	const { permission, deviceList, noDevices } = useBrowserPermission('audio');

	useEffect(() => {
		if (streamRef?.current) {
			if (status) {
				streamRef.current.srcObject = streamTrack;
			} else {
				streamRef.current.srcObject = null;
			}
		}
	}, [streamTrack, status, streamRef]);

	const toggleStream = useCallback(
		(audio: boolean, deviceId: string | undefined) => {
			freeMediaResources(streamTrack);
			if (audio) {
				getAudioStream(true, true, deviceId).then((stream: MediaStream) => {
					setStreamTrack(stream);
					setStatus(audio);
					setDeviceId(deviceId);
				});
			} else {
				setStreamTrack(null);
				setStatus(audio);
				setDeviceId(deviceId);
			}
		},
		[streamTrack]
	);

	useEffect(() => {
		if (status) {
			toggleStream(status, deviceId);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const mediaAudioList = useMemo(
		() =>
			map(deviceList, (audioItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: audioItem.label ? audioItem.label : unknownDeviceLabel,
				value: audioItem.deviceId
			})),
		[deviceList, unknownDeviceLabel]
	);

	const onChangeSource = useCallback(
		(audioItem: string | null) => {
			if (status) {
				toggleStream(true, audioItem ?? '');
			}
			setDeviceId(audioItem ?? '');
		},
		[status, toggleStream]
	);

	useEffect(() => {
		if (deviceId === undefined && mediaAudioList[0]) {
			const defaultDevice = find(mediaAudioList, ['value', 'default']) ?? mediaAudioList[0];
			setDeviceId(defaultDevice.value);
		}
	}, [mediaAudioList, deviceId]);

	useEffect(() => {
		if (status && permission === 'denied') {
			toggleStream(false, undefined);
		}
	}, [permission, status, toggleStream]);

	const audioSelected = useMemo(
		() => find(mediaAudioList, ['value', deviceId]) ?? mediaAudioList[0],
		[deviceId, mediaAudioList]
	);

	const audioTooltip = useMemo(() => {
		if (permission !== 'granted') return giveMediaPermissionSnackbar;
		return status ? disableMicLabel : enableMicLabel;
	}, [permission, giveMediaPermissionSnackbar, status, disableMicLabel, enableMicLabel]);

	const HandlerComponent = useMemo(
		() => (
			<Container
				height="fit"
				width="fill"
				orientation="horizontal"
				gap="1rem"
				crossAlignment="flex-start"
			>
				<Row>
					<Tooltip placement="top" label={audioTooltip}>
						<Button
							icon={status ? 'Mic' : 'MicOff'}
							size="extralarge"
							minWidth="extralarge"
							backgroundColor="primary"
							onClick={() => toggleStream(!status, deviceId)}
							data-testid={'turn_on_audio'}
							disabled={permission !== 'granted' || noDevices}
						/>
					</Tooltip>
				</Row>
				<Row takeAvailableSpace>
					<Select
						label={noDevices ? noDevicesLabel : micDeviceLabel}
						data-testid={'audio-select'}
						items={mediaAudioList}
						onChange={onChangeSource}
						selection={audioSelected}
						placement="bottom-end"
						showCheckbox={false}
						disablePortal
						disabled={permission !== 'granted' || noDevices}
					/>
				</Row>
				{permission === 'denied' && (
					<Snackbar
						open={permission === 'denied'}
						disableAutoHide
						severity="info"
						label={giveMediaPermissionSnackbar}
						hideButton
					/>
				)}
			</Container>
		),
		[
			audioTooltip,
			status,
			permission,
			noDevices,
			noDevicesLabel,
			micDeviceLabel,
			mediaAudioList,
			onChangeSource,
			audioSelected,
			giveMediaPermissionSnackbar,
			toggleStream,
			deviceId
		]
	);

	return {
		AudioHandlerComponent: HandlerComponent,
		audioStatus: status,
		audioDeviceId: deviceId
	};
};
