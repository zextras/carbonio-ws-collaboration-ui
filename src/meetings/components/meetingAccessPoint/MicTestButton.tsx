/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useRef, useCallback, useEffect, SVGProps } from 'react';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Button } from '@zextras/carbonio-design-system';

type ButtonState = 'ready' | 'recording' | 'playing';

interface MicrophoneTestButtonProps {
	stream: MediaStream | null;
	recordingDuration?: number;
	disabled?: boolean;
}

// Animazioni
const iconPulse = keyframes`
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.3);
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

// Wrapper per override colori
const ButtonWrapper = styled.div<{ state: ButtonState; progress: number }>`
	position: relative;
	width: 100%;
	min-width: 14rem;
	border-radius: 4px;
	overflow: hidden;

	/* Progress bar background */
	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: ${({ progress }) => progress}%;
		background: ${({ state }) =>
			state === 'recording' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'};
		transition: ${({ state }) => (state === 'recording' ? 'none' : 'width 0.2s')};
		z-index: 1;
		pointer-events: none;
		border-radius: 4px;
	}

	button {
		position: relative;
		z-index: 0;
		width: 100%;

		${({ state }) => {
			switch (state) {
				case 'recording':
					return `
						background: #ef4444 !important;
						border-color: #ef4444 !important;
						color: white !important;
						
						&:hover:not(:disabled) {
							background: #dc2626 !important;
						}
					`;
				case 'playing':
					return `
						background: #2B73D2 !important;
						border-color: #2B73D2 !important;
						color: white !important;
						
						&:hover:not(:disabled) {
							background: #1e5bb8 !important;
						}
					`;
				default:
					return '';
			}
		}}
	}
`;

// Styled components per le icone
const RecordingIconStyled = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	line-height: 1;
	color: currentColor;
	animation: ${iconPulse} 0.8s ease-in-out infinite;
`;

const MicIconStyled = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	line-height: 1;
	color: currentColor;
`;

const WaveformContainer = styled.span`
	color: currentColor;
	display: inline-flex;
	align-items: center;
	gap: 3px; // Aumentato da 2px a 3px
	margin-left: 8px;
`;

const WaveBar = styled.span<{ delay: number; height: number }>`
	display: inline-block;
	width: 3px; // Aumentato da 2px a 3px
	height: ${({ height }) => height}px;
	color: currentColor;
	border-radius: 1px;
	animation: ${miniWave} 0.8s ease-in-out infinite;
	animation-delay: ${({ delay }) => delay}s;
`;

// Componenti IconComponent per il Button
const RecordingIcon = (props: SVGProps<SVGSVGElement>) => (
	<RecordingIconStyled {...(props as any)}>●</RecordingIconStyled>
);

const MicIcon = (props: SVGProps<SVGSVGElement>) => (
	<MicIconStyled {...(props as any)}>🎤</MicIconStyled>
);

const WaveformIcon = (props: SVGProps<SVGSVGElement>) => (
	<WaveformContainer {...(props as any)}>
		<WaveBar delay={0} height={8} />
		<WaveBar delay={0.1} height={12} />
		<WaveBar delay={0.2} height={16} />
		<WaveBar delay={0.3} height={12} />
		<WaveBar delay={0.4} height={8} />
	</WaveformContainer>
);

export const MicTestButton = ({
	stream,
	recordingDuration = 4000,
	disabled = false
}: MicrophoneTestButtonProps): React.ReactElement => {
	const [state, setState] = useState<ButtonState>('ready');
	const [progress, setProgress] = useState(0);
	const [hasCompletedTest, setHasCompletedTest] = useState(false);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(
		() => (): void => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
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

	const playRecording = useCallback(() => {
		const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
		const audioUrl = URL.createObjectURL(audioBlob);

		const audio = new Audio(audioUrl);
		audioRef.current = audio;

		audio.onloadedmetadata = (): void => {
			setState('playing');
			setProgress(0);
			audio.play();
		};

		audio.onended = (): void => {
			URL.revokeObjectURL(audioUrl);
			audioRef.current = null;
			setState('ready');
			setProgress(0);
			setHasCompletedTest(true);
		};

		audio.onerror = (error): void => {
			console.error('Failed to play recording:', error);
			URL.revokeObjectURL(audioUrl);
			audioRef.current = null;
			setState('ready');
			setProgress(0);
		};
	}, []);

	const stopRecording = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
			progressIntervalRef.current = null;
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
			};

			mediaRecorder.start();
			setState('recording');
			setProgress(0);

			const startTime = Date.now();
			const intervalTime = 50;
			const increment = (100 / recordingDuration) * intervalTime;

			timerRef.current = setInterval(() => {
				const elapsed = Date.now() - startTime;
				const remaining = Math.max(0, recordingDuration - elapsed);

				if (remaining <= 0) {
					stopRecording();
				}
			}, 100);

			progressIntervalRef.current = setInterval(() => {
				setProgress((prev) => {
					const newProgress = prev + increment;
					return newProgress >= 100 ? 100 : newProgress;
				});
			}, intervalTime);
		} catch (error) {
			console.error('Failed to start recording:', error);
			setState('ready');
			setProgress(0);
		}
	}, [stream, state, disabled, playRecording, recordingDuration, stopRecording]);

	const handleClick = useCallback(() => {
		if (state === 'ready') {
			startRecording();
		}
	}, [state, startRecording]);

	const getButtonText = (): string => {
		switch (state) {
			case 'ready':
				return hasCompletedTest ? 'START MICROPHONE TEST AGAIN' : 'START MICROPHONE TEST';
			case 'recording':
				return 'RECORDING...';
			case 'playing':
				return 'PLAYING RECORDING...';
			default:
				return '';
		}
	};

	const getButtonIcon = (): undefined => {
		switch (state) {
			case 'recording':
				return RecordingIcon;
			case 'ready':
				return MicIcon;
			case 'playing':
				return WaveformIcon;
			default:
				return undefined;
		}
	};

	const isButtonDisabled = disabled || state === 'recording' || state === 'playing';

	return (
		<ButtonWrapper state={state} progress={progress}>
			<Button
				type={'outlined'}
				width={'fill'}
				label={getButtonText()}
				icon={getButtonIcon()}
				iconPlacement="right"
				onClick={handleClick}
				disabled={isButtonDisabled}
			/>
		</ButtonWrapper>
	);
};
