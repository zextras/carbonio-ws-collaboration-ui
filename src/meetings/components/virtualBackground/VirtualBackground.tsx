/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect, useMemo, useRef } from 'react';

import styled from '@emotion/styled';

import SelfieSegmentationManager from './SelfieSegmentationManager';
import useVirtualBackground from '../../../hooks/useVirtualBackground';
import {
	getBackgroundImage,
	getLocalStreamVideo,
	getUpdatedStream
} from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import { VirtualBackgroundType } from '../../../types/store/ActiveMeetingTypes';
import { getWorkerUrl } from '../../../utils/MeetingsUtils';

const BackgroundCanvas = styled.canvas`
	display: none;
	margin: auto;
	padding: 0;
	width: 100%;
`;

type VirtualBackgroundProps = {
	meetingId: string | undefined;
};

const VideoEl = styled.video`
	width: 0;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
`;

const VirtualBackground = ({ meetingId }: VirtualBackgroundProps): ReactElement => {
	const canvasRefs = useRef<HTMLCanvasElement | null>(null);
	const setBackgroundStream = useStore((store) => store.setBackgroundStream);
	const videoOutConn = useStore((store) => store.activeMeeting?.videoOutConn);
	const updatedStream = useStore(getUpdatedStream);
	const removeBackgroundStream = useStore((store) => store.removeBackgroundStream);
	const myVideoStream = useStore(getLocalStreamVideo);
	const backgroundImageSelected = useStore(getBackgroundImage);

	const worker: Worker = useMemo(() => new Worker(getWorkerUrl()), []);

	const myStreamRef = useRef<HTMLVideoElement | null>(null);

	const { paintStreamWithBlur, paintStreamWithBackground } = useVirtualBackground(
		backgroundImageSelected,
		canvasRefs
	);

	const selfieSegmentationManager = useMemo(() => new SelfieSegmentationManager(), []);

	useEffect(() => {
		if (backgroundImageSelected !== VirtualBackgroundType.NONE) {
			selfieSegmentationManager.setResultsCallback(
				backgroundImageSelected === VirtualBackgroundType.BLUR
					? paintStreamWithBlur
					: paintStreamWithBackground
			);
		}
	}, [
		selfieSegmentationManager,
		paintStreamWithBackground,
		paintStreamWithBlur,
		backgroundImageSelected,
		worker
	]);

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
		if (backgroundImageSelected !== VirtualBackgroundType.NONE) {
			selfieSegmentationManager.initialize().then(() => {
				worker.postMessage({ type: 'start' });
				if (canvasRefs?.current) {
					const canvasStream = canvasRefs.current.captureStream();
					videoOutConn?.updateLocalStreamTrack(canvasStream, true).then(() => {
						setBackgroundStream(canvasStream);
					});
				}
			});
			handleMessageWorker();
		}

		return (): void => {
			worker.postMessage({ type: 'stop' });
		};
	}, [
		meetingId,
		sendSelfieSegmentation,
		setBackgroundStream,
		videoOutConn,
		myVideoStream,
		worker,
		handleMessageWorker,
		backgroundImageSelected,
		selfieSegmentationManager
	]);

	useEffect(() => {
		if (backgroundImageSelected === VirtualBackgroundType.NONE && updatedStream !== undefined) {
			removeBackgroundStream();
			if (myVideoStream) {
				videoOutConn?.updateLocalStreamTrack(myVideoStream);
			}
			worker.postMessage({ type: 'stop' });
		}
	}, [
		meetingId,
		removeBackgroundStream,
		updatedStream,
		videoOutConn,
		myVideoStream,
		worker,
		backgroundImageSelected
	]);

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
			<BackgroundCanvas ref={canvasRefs} />
			<VideoEl playsInline autoPlay muted controls={false} ref={myStreamRef} />
		</>
	);
};

export default VirtualBackground;
