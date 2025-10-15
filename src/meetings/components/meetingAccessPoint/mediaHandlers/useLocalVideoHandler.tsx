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
import { getVideoStream } from '../../../../utils/UserMediaManager';

type UseLocalMediaHandlerParams = {
	initialStatus: boolean;
	streamRef: React.RefObject<HTMLVideoElement>;
};

type UseLocalMediaHandlerReturn = {
	VideoHandlerComponent: React.ReactElement;
	videoStatus: boolean;
	videoDeviceId: string | undefined;
};

export const useLocalVideoHandler = ({
	initialStatus,
	streamRef
}: UseLocalMediaHandlerParams): UseLocalMediaHandlerReturn => {
	const [t] = useTranslation();
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

	const { permission, deviceList, noDevices } = useBrowserPermission('video');

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
		(video: boolean, deviceId: string | undefined) => {
			freeMediaResources(streamTrack);
			if (video) {
				getVideoStream(deviceId).then((stream: MediaStream) => {
					setStreamTrack(stream);
					setStatus(video);
					setDeviceId(deviceId);
				});
			} else {
				setStreamTrack(null);
				setStatus(video);
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

	const mediaVideoList: { id: string; label: string; value: string }[] = useMemo(
		() =>
			map(deviceList, (videoItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: videoItem.label ? videoItem.label : unknownDeviceLabel,
				value: videoItem.deviceId
			})),
		[unknownDeviceLabel, deviceList]
	);

	const onChangeSource = useCallback(
		(videoItem: string | null) => {
			if (status) {
				toggleStream(true, videoItem ?? '');
			}
			setDeviceId(videoItem ?? '');
		},
		[status, toggleStream]
	);

	useEffect(() => {
		if (deviceId === undefined && mediaVideoList[0]) {
			const defaultDevice = find(mediaVideoList, ['value', 'default']) ?? mediaVideoList[0];
			setDeviceId(defaultDevice.value);
		}
	}, [mediaVideoList, deviceId]);

	useEffect(() => {
		if (status && permission === 'denied') {
			toggleStream(false, undefined);
		}
	}, [permission, status, toggleStream]);

	const videoSelected = useMemo(
		() => find(mediaVideoList, ['value', deviceId]) ?? mediaVideoList[0],
		[mediaVideoList, deviceId]
	);

	const videoTooltip = useMemo(() => {
		if (permission !== 'granted') return giveMediaPermissionSnackbar;
		return status ? disableCamLabel : enableCamLabel;
	}, [permission, giveMediaPermissionSnackbar, status, disableCamLabel, enableCamLabel]);

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
					<Tooltip placement="top" label={videoTooltip}>
						<Button
							icon={status ? 'Video' : 'VideoOff'}
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
						label={noDevices ? noDevicesLabel : camDeviceLabel}
						items={mediaVideoList}
						onChange={onChangeSource}
						selection={videoSelected}
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
			videoTooltip,
			status,
			permission,
			noDevices,
			noDevicesLabel,
			camDeviceLabel,
			mediaVideoList,
			onChangeSource,
			videoSelected,
			giveMediaPermissionSnackbar,
			toggleStream,
			deviceId
		]
	);

	return {
		VideoHandlerComponent: HandlerComponent,
		videoStatus: status,
		videoDeviceId: deviceId
	};
};
