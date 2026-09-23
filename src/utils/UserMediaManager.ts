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
		// Keep the capture at 16:9 (aspectRatio 1.7777) — without it some cameras (notably macOS
		// Continuity Camera) negotiate a portrait mode. Capture at the top simulcast tier (720p); the
		// publisher scales this down per tier (scaleResolutionDownBy), so a higher capture is pure waste.
		// Cap the framerate at 30 so 60fps cameras don't waste bitrate/CPU and the temporal ladder stays a
		// clean 30/15 (full/mid layer) for the downlink controller.
		const videoConstraints: MediaTrackConstraints = {
			...CONSTRAINT_ASPECT_RATIO,
			height: { ideal: 720 },
			frameRate: { ideal: 30, max: 30 }
		};
		const constraints = deviceId
			? { video: { deviceId: { exact: deviceId }, ...videoConstraints } }
			: { video: videoConstraints };
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
		.getUserMedia({ video: { facingMode: 'user', ...CONSTRAINT_ASPECT_RATIO } })
		.catch(() => navigator.mediaDevices.getUserMedia({ video: CONSTRAINT_ASPECT_RATIO }));

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
