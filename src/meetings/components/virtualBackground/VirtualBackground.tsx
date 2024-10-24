/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	MutableRefObject,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef
} from 'react';

import { GpuBuffer } from '@mediapipe/selfie_segmentation';
import styled from 'styled-components';

import SelfieSegmentationManager, { ISelfieSegmentation } from './SelfieSegmentationManager';
import {
	getIsBackgroundBlurred,
	getLocalStreamVideo,
	getUpdatedStream
} from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import { BrowserUtils } from '../../../utils/BrowserUtils';
import { getWorkerUrl } from '../../../utils/MeetingsUtils';

const VirtualBackgroundCanvas = styled.canvas<{
	ref: MutableRefObject<HTMLCanvasElement | null>;
}>`
	display: none;
	margin: auto;
	padding: 0;
	width: 100%;
`;

type VirtualBackgroundProps = {
	meetingId: string | undefined;
};

const VideoEl = styled.video<{
	playsInline: boolean;
	autoPlay: boolean;
	muted: boolean;
	controls: boolean;
	ref: MutableRefObject<HTMLVideoElement | null>;
}>`
	width: 0;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
`;

const VirtualBackground = ({ meetingId }: VirtualBackgroundProps): ReactElement => {
	const canvasBgRefs = useRef<HTMLCanvasElement | null>(null);
	const setBackgroundStream = useStore((store) => store.setBackgroundStream);
	const videoOutConn = useStore((store) => store.activeMeeting[meetingId ?? '']?.videoOutConn);
	const updatedStream = useStore((store) => getUpdatedStream(store, meetingId ?? ''));
	const removeBackgroundStream = useStore((store) => store.removeBackgroundStream);
	const blur = useStore((store) => getIsBackgroundBlurred(store, meetingId ?? ''));
	const myVideoStream = useStore((store) => getLocalStreamVideo(store, meetingId ?? ''));

	const myStreamRef = useRef<HTMLVideoElement | null>(null);

	const paintStreamWithBlur = useCallback(
		(results: { image: GpuBuffer; segmentationMask: GpuBuffer }) => {
			const canvas = canvasBgRefs?.current;
			if (canvas) {
				const context = canvas.getContext('2d');
				if (context) {
					// setup canvas width and height to be the same as the results one
					context.canvas.width = 640;
					if (BrowserUtils.isFirefox()) {
						context.canvas.height = 480;
					} else {
						context.canvas.height = 360;
					}

					// Clear the canvas
					context.clearRect(0, 0, canvas.width, canvas.height);

					// Draw the segmentation mask
					context.save();
					context.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

					// Apply blur effect
					context.globalCompositeOperation = 'source-out';
					context.filter = 'blur(10px)';
					context.drawImage(results.image, 0, 0, results.image.width, results.image.height);
					context.filter = 'none';
					context.globalCompositeOperation = 'destination-atop';
					context.drawImage(results.image, 0, 0, results.image.width, results.image.height);
					context.restore();
				}
			}
		},
		[canvasBgRefs]
	);

	const selfieSegmentationManager: ISelfieSegmentation = useMemo(
		() => new SelfieSegmentationManager(paintStreamWithBlur),
		[paintStreamWithBlur]
	);

	const worker: Worker = useMemo(() => new Worker(getWorkerUrl()), []);

	const sendSelfieSegmentation = useCallback(() => {
		if (myStreamRef?.current && myStreamRef.current.readyState >= HTMLMediaElement.HAVE_METADATA) {
			selfieSegmentationManager.send(myStreamRef.current);
		}
	}, [selfieSegmentationManager]);

	const handleMessageWorker = useCallback(() => {
		worker.onmessage = (event): void => {
			switch (event.data) {
				case 'update': {
					sendSelfieSegmentation();
					break;
				}
				case 'workerStarted': {
					worker.postMessage({ type: 'frameUpdateTimer' });
					break;
				}
				default:
					break;
			}
		};
	}, [sendSelfieSegmentation, worker]);

	useEffect(() => {
		if (blur) {
			selfieSegmentationManager.initialize().then(() => {
				worker.postMessage({ type: 'start' });
				if (canvasBgRefs?.current) {
					const canvasStream = canvasBgRefs.current.captureStream();
					videoOutConn?.updateLocalStreamTrack(canvasStream, true).then(() => {
						setBackgroundStream(meetingId ?? '', canvasStream);
					});
				}
			});
			handleMessageWorker();
		}

		return (): void => {
			worker.postMessage({ type: 'stop' });
		};
	}, [
		blur,
		meetingId,
		selfieSegmentationManager,
		sendSelfieSegmentation,
		setBackgroundStream,
		videoOutConn,
		myVideoStream,
		worker,
		handleMessageWorker
	]);

	useEffect(() => {
		if (!blur && updatedStream !== undefined) {
			removeBackgroundStream(meetingId ?? '');
			if (myVideoStream) {
				videoOutConn?.updateLocalStreamTrack(myVideoStream);
			}
			worker.postMessage({ type: 'stop' });
		}
	}, [blur, meetingId, removeBackgroundStream, updatedStream, videoOutConn, myVideoStream, worker]);

	useEffect(() => {
		if (myStreamRef?.current) {
			if (myVideoStream) {
				myStreamRef.current.srcObject = myVideoStream;
			} else {
				myStreamRef.current.srcObject = null;
			}
		}
	}, [meetingId, myVideoStream]);

	return (
		<>
			<VirtualBackgroundCanvas ref={canvasBgRefs} />
			<VideoEl playsInline autoPlay muted controls={false} ref={myStreamRef} />
		</>
	);
};

export default VirtualBackground;
