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

import useBrowserPermission from '../../../hooks/useMediaDevices';
import { freeMediaResources } from '../../../utils/MeetingsUtils';
import { getAudioStream, getVideoStream } from '../../../utils/UserMediaManager';

type UseLocalMediaHandlerParams = {
	mediaType: 'audio' | 'video';
	initialStatus?: boolean;
	streamRef?: React.RefObject<HTMLAudioElement | HTMLVideoElement>;
};

type UseLocalMediaHandlerReturn = {
	HandlerComponent: React.ReactElement;
	status: boolean;
	deviceId: string | undefined;
	streamTrack: MediaStream | null;
};

export const useLocalMediaHandler = ({
	mediaType,
	initialStatus = false,
	streamRef
}: UseLocalMediaHandlerParams): UseLocalMediaHandlerReturn => {
	const [t] = useTranslation();
	const disableMicLabel = t('meeting.interactions.disableMicrophone', 'Disable microphone');
	const enableMicLabel = t('meeting.interactions.enableMicrophone', 'Enable microphone');
	const micDeviceLabel = t('interactions.micDevice', 'Microphone device');
	const disableCamLabel = t('meeting.interactions.disableCamera', 'Disable camera');
	const enableCamLabel = t('meeting.interactions.enableCamera', 'Enable camera');
	const camDeviceLabel = t('interactions.camDevice', 'Camera device');
	const giveMediaPermissionSnackbar = t(
		'meeting.interactions.browserPermission',
		'Grant browser permissions to enable resources'
	);
	const unknownDeviceLabel = t('meeting.interactions.unknownDevice', 'Unknown device');
	const noDevicesLabel = t('meeting.interactions.noDevices', 'No devices available');

	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [status, setStatus] = useState(initialStatus);
	const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

	const { permission, deviceList, noDevices } = useBrowserPermission(mediaType);

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
		(newStatus: boolean, newDeviceId: string | undefined) => {
			freeMediaResources(streamTrack);
			if (newStatus) {
				const getStream = mediaType === 'audio' ? getAudioStream : getVideoStream;
				getStream(newDeviceId).then((newStream: MediaStream) => {
					setStreamTrack(newStream);
					setStatus(newStatus);
					setDeviceId(newDeviceId);
				});
			} else {
				setStreamTrack(null);
				setStatus(newStatus);
				setDeviceId(newDeviceId);
			}
		},
		[mediaType, streamTrack]
	);

	const mediaDeviceList: { id: string; label: string; value: string }[] = useMemo(
		() =>
			map(deviceList, (deviceItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: deviceItem.label ? deviceItem.label : unknownDeviceLabel,
				value: deviceItem.deviceId
			})),
		[unknownDeviceLabel, deviceList]
	);

	// Initially open the stream with default device if no device is selected
	useEffect(() => {
		if (!deviceId && mediaDeviceList[0]) {
			const defaultDevice = find(mediaDeviceList, ['value', 'default']) ?? mediaDeviceList[0];
			toggleStream(status, defaultDevice.value);
		}
	}, [mediaDeviceList, deviceId, toggleStream, status]);

	useEffect(
		() => () => {
			freeMediaResources(streamTrack);
		},
		[streamTrack]
	);

	useEffect(() => {
		if (status && permission === 'denied') {
			toggleStream(false, undefined);
		}
	}, [permission, status, toggleStream]);

	const onChangeSource = useCallback(
		(newDeviceId: string | null) => {
			toggleStream(true, newDeviceId ?? '');
		},
		[toggleStream]
	);

	const buttonIcon = useMemo(() => {
		if (mediaType === 'audio') {
			return status ? 'Mic' : 'MicOff';
		}
		return status ? 'Video' : 'VideoOff';
	}, [mediaType, status]);

	const buttonTooltip = useMemo(() => {
		if (permission !== 'granted') return giveMediaPermissionSnackbar;
		if (mediaType === 'audio') {
			return status ? disableMicLabel : enableMicLabel;
		}
		return status ? disableCamLabel : enableCamLabel;
	}, [
		permission,
		giveMediaPermissionSnackbar,
		mediaType,
		status,
		disableCamLabel,
		enableCamLabel,
		disableMicLabel,
		enableMicLabel
	]);

	const selectDeviceLabel = useMemo(() => {
		if (noDevices) return noDevicesLabel;
		if (mediaType === 'audio') return micDeviceLabel;
		return camDeviceLabel;
	}, [noDevices, noDevicesLabel, mediaType, micDeviceLabel, camDeviceLabel]);

	const deviceSelected = useMemo(
		() =>
			find(mediaDeviceList, ['value', deviceId]) ??
			find(mediaDeviceList, ['value', 'default']) ??
			mediaDeviceList[0],
		[mediaDeviceList, deviceId]
	);

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
					<Tooltip placement="top" label={buttonTooltip}>
						<Button
							icon={buttonIcon}
							size="extralarge"
							minWidth="extralarge"
							backgroundColor="primary"
							onClick={() => toggleStream(!status, deviceId)}
							disabled={permission !== 'granted' || noDevices}
						/>
					</Tooltip>
				</Row>
				<Row takeAvailableSpace>
					<Select
						label={selectDeviceLabel}
						items={mediaDeviceList}
						onChange={onChangeSource}
						selection={deviceSelected}
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
			buttonTooltip,
			buttonIcon,
			permission,
			noDevices,
			selectDeviceLabel,
			mediaDeviceList,
			onChangeSource,
			deviceSelected,
			giveMediaPermissionSnackbar,
			toggleStream,
			status,
			deviceId
		]
	);

	return {
		HandlerComponent,
		status,
		deviceId,
		streamTrack
	};
};
