/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const CONSTRAINT_ASPECT_RATIO: MediaTrackConstraints = {
	aspectRatio: 1.7777
	// video: { aspectRatio: 1.618 }
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
 * @param noiseSuppression https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/noiseSuppression
 * @param echoCancellation https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/echoCancellation
 * @param deviceId Id of media to request if available
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */
export const getAudioStream = (
	noiseSuppression?: boolean | true,
	echoCancellation?: boolean | true,
	deviceId?: string
): Promise<MediaStream> =>
	new Promise((resolve, reject) => {
		const constraints = deviceId
			? {
					audio: {
						deviceId: { exact: deviceId },
						noiseSuppression,
						echoCancellation,
						autoGainControl: false
					}
				}
			: {
					audio: {
						autoGainControl: false,
						noiseSuppression,
						echoCancellation
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
			? { video: { deviceId: { exact: deviceId }, ...CONSTRAINT_ASPECT_RATIO } }
			: { video: CONSTRAINT_ASPECT_RATIO };
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

export const getAudioAndVideo = (
	audio?:
		| boolean
		| {
				noiseSuppression?: boolean | true;
				echoCancellation?: boolean | true;
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
