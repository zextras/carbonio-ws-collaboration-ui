/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
	aspectRatio: 1.7777,
	height: { ideal: 720 }
};

/**
 * EnumerateDevice not supported only on Firefox at today(07/07/23) still experimental
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
 */
export const enumerateDevices = (): void => {
	if (!navigator.mediaDevices.enumerateDevices) {
		console.log('enumerateDevices() not supported');
		return;
	}
	navigator.mediaDevices
		.enumerateDevices()
		.then((devices) => {
			devices.forEach((device) => {
				console.log(device);
				console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
			});
		})
		.catch((err) => {
			console.log(`${err.name}: ${err.message}`);
		});
};

/**
 * Request the audio stream for the session with optional params
 * @param deviceId Id of media to request if available
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */
export const getAudioStream = (deviceId?: string): Promise<MediaStream> =>
	new Promise((resolve, reject) => {
		const constraints: MediaStreamConstraints = {
			audio: {
				noiseSuppression: true,
				echoCancellation: true,
				autoGainControl: true,
				...(deviceId && { deviceId: { exact: deviceId } })
			}
		};

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then((stream: MediaStream) => {
				resolve(stream);
			})
			.catch((err) => {
				console.error('Error while requesting audio track', err);
				reject(err);
			});
	});

/**
 * Request the video stream for the session
 * @param deviceId
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */
export const getVideoStream = (deviceId?: string): Promise<MediaStream> =>
	new Promise((resolve, reject) => {
		const constraints = deviceId
			? { video: { deviceId: { exact: deviceId }, ...VIDEO_CONSTRAINTS } }
			: { video: VIDEO_CONSTRAINTS };
		navigator.mediaDevices
			.getUserMedia(constraints)
			.then((stream: MediaStream) => {
				resolve(stream);
			})
			.catch((err) => {
				console.error('Error while requesting video track', err);
				reject(err);
			});
	});

/**
 * Request the front camera stream on mobile devices using facingMode constraint.
 * Uses facingMode 'user' as an ideal (non-exact) constraint so that desktop browsers
 * without facingMode support can still fall back to any available camera.
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */
export const getFrontCameraStream = (): Promise<MediaStream> =>
	navigator.mediaDevices
		.getUserMedia({ video: { facingMode: 'user', ...VIDEO_CONSTRAINTS } })
		.catch(() => navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS }));

export const getAudioAndVideo = (
	audio?:
		| boolean
		| {
				noiseSuppression?: boolean;
				echoCancellation?: boolean;
				deviceId?: { exact: string };
		  },
	video?: boolean | { deviceId?: { exact: string } }
): Promise<MediaStream> =>
	new Promise((resolve, reject) => {
		navigator.mediaDevices
			.getUserMedia({
				video,
				audio
			})
			.then((stream: MediaStream) => {
				resolve(stream);
			})
			.catch((err) => {
				console.error('Error while requesting video and audio tracks', err);
				reject(err);
			});
	});

/**
 * Request the screen stream for the session
 * https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture
 */
export const getScreenStream = (): Promise<MediaStream> =>
	new Promise((resolve, reject) => {
		navigator.mediaDevices
			.getDisplayMedia({ video: true })
			.then((stream: MediaStream) => {
				resolve(stream);
			})
			.catch((err) => {
				console.error('Error while requesting screen track', err);
				reject(err);
			});
	});
