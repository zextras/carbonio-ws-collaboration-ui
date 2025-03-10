/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useState, useEffect, useCallback, useMemo } from 'react';

import { filter } from 'lodash';

import { BrowserUtils } from '../utils/BrowserUtils';

const useMediaDevices = (
	deviceType: 'audio' | 'video'
): {
	permission?: PermissionState;
	deviceList: MediaDeviceInfo[];
	noDevices: boolean;
} => {
	const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);
	const [permissionStatus, setPermissionStatus] = useState<PermissionState | undefined>(undefined);

	const updateDevices = useCallback(() => {
		const deviceKind = deviceType === 'audio' ? 'audioinput' : 'videoinput';
		navigator.mediaDevices
			.enumerateDevices()
			.then((devices) => {
				const inputs = filter(devices, (device: MediaDeviceInfo) => device.kind === deviceKind);
				setDeviceList(inputs);
			})
			.catch((e) => {
				console.log(e);
			});
	}, [deviceType]);

	useEffect(() => {
		if (permissionStatus === 'granted') {
			updateDevices();
		}
	}, [updateDevices, permissionStatus]);

	useEffect(() => {
		navigator.mediaDevices.addEventListener('devicechange', updateDevices);
		return (): void => {
			navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
		};
	}, [updateDevices]);

	const getUserMedia = useCallback(() => {
		navigator.mediaDevices
			.getUserMedia({
				audio: deviceType === 'audio',
				video: deviceType === 'video'
			})
			.then((stream) => {
				stream.getTracks().forEach((track) => track.stop());
				updateDevices();
				setPermissionStatus('granted');
			})
			.catch(() => {
				setPermissionStatus('denied');
			});
	}, [deviceType, updateDevices]);

	useEffect(() => {
		if (permissionStatus === 'prompt') {
			getUserMedia();
		}
	}, [permissionStatus, getUserMedia]);

	useEffect(() => {
		updateDevices();
		if (navigator.permissions && !BrowserUtils.isFirefox()) {
			const permissionName = deviceType === 'audio' ? 'microphone' : 'camera';
			navigator.permissions
				.query({ name: permissionName as PermissionName })
				.then((state) => {
					setPermissionStatus(state.state);
					// eslint-disable-next-line no-param-reassign
					state.onchange = (event: Event): void => {
						// @ts-ignore
						const permissionState = event.target?.state as PermissionState;
						setPermissionStatus(permissionState);
					};
				})
				.catch(() => {
					getUserMedia();
				});
		} else {
			getUserMedia();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const noDevices = useMemo(() => deviceList.length === 0, [deviceList]);

	return {
		deviceList,
		permission: !noDevices ? permissionStatus : 'granted',
		noDevices
	};
};

export default useMediaDevices;
