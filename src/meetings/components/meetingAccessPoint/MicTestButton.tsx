/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import {
	Button,
	ButtonProps,
	Container,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

const StyledText = styled(Text)`
	user-select: none;
	text-transform: uppercase;
`;

type ButtonState = 'ready' | 'recording' | 'playing';

type MicrophoneTestButtonProps = Pick<ButtonProps, 'backgroundColor'> & {
	stream: MediaStream | null;
	recordingDuration?: number;
	disabled?: boolean;
};

const RMS_THRESHOLD = 0.01;

const pulse = keyframes`
	0%, 100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.5);
		opacity: 0.5;
	}
`;

const miniWave = keyframes`
	0%, 100% {
		opacity: 0.5;
		transform: scaleY(0.7);
	}
	50% {
		opacity: 1;
		transform: scaleY(1.2);
	}
`;

const fillProgress = keyframes`
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
`;

const ButtonWrapper = styled(Container)<{ duration: number }>`
	position: relative;
	overflow: hidden;
	padding: 0.5rem;

	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: 0;
		background: rgba(0, 0, 0, 0.15);
		border-radius: 4px;
		pointer-events: none;
		z-index: 0;
		animation: ${fillProgress} ${({ duration }): number => duration}ms linear forwards;
	}
`;

const Dot = styled.div`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background-color: #ffffff;
	animation: ${pulse} 1s ease-in-out infinite;
	will-change: transform, opacity;
`;

const WaveformContainer = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 3px;
	margin-left: 8px;
`;

const WaveBar = styled.span<{ delay: number; height: number }>`
	display: inline-block;
	width: 3px;
	height: ${({ height }): number => height}px;
	border-radius: 1px;
	background-color: #ffffff;
	animation: ${miniWave} 0.8s ease-in-out infinite;
	animation-delay: ${({ delay }): number => delay}s;
`;

const analyzeAudioBlob = async (blob: Blob): Promise<number> => {
	try {
		const audioContext = new AudioContext();
		const arrayBuffer = await blob.arrayBuffer();
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
		const channelData = audioBuffer.getChannelData(0);

		const sum = Array.from(channelData).reduce((acc, sample) => acc + sample * sample, 0);
		const rms = Math.sqrt(sum / channelData.length);
		await audioContext.close();
		return rms;
	} catch (error) {
		console.error('Error analyzing audio blob:', error);
		return 0;
	}
};

export const MicTestButton = ({
	stream,
	recordingDuration = 4000,
	disabled = false,
	backgroundColor
}: MicrophoneTestButtonProps): React.ReactElement => {
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();
	const [state, setState] = useState<ButtonState>('ready');
	const [hasCompletedTest, setHasCompletedTest] = useState(false);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(
		() => (): void => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.src = '';
			}
			if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
				mediaRecorderRef.current.stop();
			}
		},
		[stream]
	);

	const microphoneWorkingLabel = t(
		'meeting.micTest.microphoneWorking',
		'Microphone is working correctly'
	);

	const showMicrophoneSuccess = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			severity: 'success',
			label: microphoneWorkingLabel
		});
	}, [createSnackbar, microphoneWorkingLabel]);

	const noSoundDetectedLabel = t(
		'meeting.micTest.noSoundDetected',
		'No sound detected. Speak during recording or check your microphone'
	);

	const showMicrophoneError = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			severity: 'error',
			label: noSoundDetectedLabel
		});
	}, [createSnackbar, noSoundDetectedLabel]);

	const playRecording = useCallback(() => {
		const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
		const audioUrl = URL.createObjectURL(audioBlob);

		const audio = new Audio(audioUrl);
		audioRef.current = audio;

		audio.onloadedmetadata = (): void => {
			setState('playing');
			audio.play();
		};

		audio.onended = (): void => {
			URL.revokeObjectURL(audioUrl);
			audioRef.current = null;
			setState('ready');
			setHasCompletedTest(true);
		};

		audio.onerror = (error): void => {
			console.error('Failed to play recording:', error);
			URL.revokeObjectURL(audioUrl);
			audioRef.current = null;
			setState('ready');
		};
	}, []);

	const stopRecording = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}

		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
			mediaRecorderRef.current.stop();
		}
	}, []);

	const startRecording = useCallback(() => {
		if (!stream || state !== 'ready' || disabled) return;

		try {
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			chunksRef.current = [];

			mediaRecorder.ondataavailable = (event): void => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = (): void => {
				playRecording();
				analyzeAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' })).then((rms) => {
					if (rms > RMS_THRESHOLD) {
						showMicrophoneSuccess();
					} else {
						showMicrophoneError();
					}
				});
			};

			mediaRecorder.start();
			setState('recording');

			const startTime = Date.now();

			timerRef.current = setInterval(() => {
				const elapsed = Date.now() - startTime;
				const remaining = Math.max(0, recordingDuration - elapsed);

				if (remaining <= 0) {
					stopRecording();
				}
			}, 100);
		} catch (error) {
			console.error('Failed to start recording:', error);
			setState('ready');
		}
	}, [
		stream,
		state,
		disabled,
		playRecording,
		recordingDuration,
		stopRecording,
		showMicrophoneSuccess,
		showMicrophoneError
	]);

	const turnOnMicrophoneLabel = t(
		'meeting.micTest.turnOnMicrophone',
		'Turn on your microphone to test it'
	);

	const startMicTestAgainLabel = t(
		'meeting.micTest.startMicTestAgain',
		'Start microphone test again'
	);

	const startMicTestLabel = t('meeting.micTest.startMicTest', 'Start microphone test');

	const recordingLabel = t('meeting.micTest.recordingYourVoice', 'Recording your voice');

	const playingRecordingLabel = t('meeting.micTest.playingBack', 'Playing back...');

	const handleClick = useCallback(() => {
		if (state === 'ready') {
			startRecording();
		}
	}, [state, startRecording]);

	return (
		<>
			{state === 'ready' && (
				<Tooltip label={turnOnMicrophoneLabel} disabled={!disabled} placement={'top'}>
					<Button
						type={'outlined'}
						backgroundColor={backgroundColor}
						width={'fill'}
						label={hasCompletedTest ? startMicTestAgainLabel : startMicTestLabel}
						icon={'Mic'}
						iconPlacement="right"
						onClick={handleClick}
						disabled={disabled}
					/>
				</Tooltip>
			)}
			{state === 'recording' && (
				<ButtonWrapper
					gap={'0.5rem'}
					key={state}
					orientation={'horizontal'}
					background={'error'}
					width={'fill'}
					duration={recordingDuration}
				>
					<StyledText size={'medium'} color={'gray6'}>
						{recordingLabel}
					</StyledText>
					<Dot className={'force-white-bg'} />
				</ButtonWrapper>
			)}
			{state === 'playing' && (
				<ButtonWrapper
					gap={'0.5rem'}
					key={state}
					orientation={'horizontal'}
					background={'primary'}
					width={'fill'}
					duration={recordingDuration}
				>
					<StyledText size={'medium'} color={'gray6'}>
						{playingRecordingLabel}
					</StyledText>
					<WaveformContainer>
						<WaveBar className={'force-white-bg'} delay={0} height={8} />
						<WaveBar className={'force-white-bg'} delay={0.1} height={12} />
						<WaveBar className={'force-white-bg'} delay={0.2} height={16} />
						<WaveBar className={'force-white-bg'} delay={0.3} height={12} />
						<WaveBar className={'force-white-bg'} delay={0.4} height={8} />
					</WaveformContainer>
				</ButtonWrapper>
			)}
		</>
	);
};
