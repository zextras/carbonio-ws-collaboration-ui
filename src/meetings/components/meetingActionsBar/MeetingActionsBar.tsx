/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';
import styled, { FlattenSimpleInterpolation } from 'styled-components';

import CameraButton from './CameraButton';
import FullScreenButton from './FullScreenButton';
import LeaveMeetingButton from './LeaveMeetingButton';
import MeetingDuration from './MeetingDuration';
import MicrophoneButton from './MicrophoneButton';
import ScreenShareButton from './ScreenShareButton';
import SwitchViewButton from './SwitchViewButton';
import { MeetingRoutesParams } from '../../../hooks/useRouting';

const BarContainer = styled(Container)<{ $isHoovering: boolean }>`
	position: absolute;
	bottom: -1rem;
	width: 100%;
	transform: translateY(
		${({ $isHoovering }): string | FlattenSimpleInterpolation => ($isHoovering ? '-1rem' : '5rem')}
	);
	transition: transform 200ms linear;
	z-index: 40;
`;

const ActionsWrapper = styled(Container)`
	padding: 1rem;
	border-radius: 0.5rem;
	gap: 1rem;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
`;

const SecondActionsWrapper = styled(ActionsWrapper)`
	position: absolute;
	right: 3.25rem;
`;

type MeetingActionsProps = {
	streamsWrapperRef: RefObject<HTMLDivElement>;
};

const MeetingActionsBar = ({ streamsWrapperRef }: MeetingActionsProps): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [isHoovering, setIsHoovering] = useState<boolean>(false);
	const [isHoverActions, setIsHoverActions] = useState<boolean>(false);
	const [isAudioListOpen, setIsAudioListOpen] = useState<boolean>(false);
	const [isVideoListOpen, setIsVideoListOpen] = useState<boolean>(false);

	const audioDropdownRef = useRef<HTMLDivElement>(null);
	const videoDropdownRef = useRef<HTMLDivElement>(null);

	const timeout = useRef<NodeJS.Timeout>();

	const handleClickOutsideAudioDropdown = useCallback((e) => {
		if (audioDropdownRef.current && !audioDropdownRef.current.contains(e.target)) {
			setIsAudioListOpen(false);
		}
	}, []);

	const handleClickOutsideVideoDropdown = useCallback((e) => {
		if (videoDropdownRef.current && !videoDropdownRef.current.contains(e.target)) {
			setIsVideoListOpen(false);
		}
	}, []);

	const handleHoverMouseMove = useCallback(
		(e) => {
			if (!isHoovering) {
				timeout.current && clearTimeout(timeout.current);
				setIsHoovering(true);
				if (!isHoverActions) {
					timeout.current = setTimeout(() => {
						const NewEvent = new CustomEvent('mouseStop', { bubbles: true, cancelable: true });
						e.target.dispatchEvent(NewEvent);
					}, 2000);
				}
			}
		},
		[isHoovering, isHoverActions]
	);

	const handleHoverMouseStop = useCallback(() => {
		streamsWrapperRef?.current?.removeEventListener('mousemove', handleHoverMouseMove);
		if (!isHoverActions) {
			setIsHoovering(false);
		}
		if (isAudioListOpen) {
			setIsAudioListOpen(false);
		}
		if (isVideoListOpen) {
			setIsVideoListOpen(false);
		}
	}, [streamsWrapperRef, handleHoverMouseMove, isHoverActions, isAudioListOpen, isVideoListOpen]);

	const handleMouseEnter = useCallback(() => setIsHoverActions(true), []);

	const handleMouseLeave = useCallback(() => setIsHoverActions(false), []);

	useEffect(() => {
		let elRef: React.RefObject<HTMLDivElement> | null = streamsWrapperRef;
		if (elRef?.current && !isHoverActions) {
			elRef.current.addEventListener('mousemove', (e: MouseEvent) => handleHoverMouseMove(e));
			elRef.current.addEventListener('mouseStop', handleHoverMouseStop);
		}

		return (): void => {
			if (elRef?.current) {
				elRef.current.removeEventListener('mousemove', handleHoverMouseMove);
				elRef.current.removeEventListener('mouseStop', handleHoverMouseStop);
				elRef = null;
			}
		};
	}, [handleHoverMouseMove, handleHoverMouseStop, isHoverActions, streamsWrapperRef]);

	useEffect(() => {
		let elRef: React.RefObject<HTMLDivElement> | null = streamsWrapperRef;
		if (elRef.current) {
			if (isAudioListOpen) {
				elRef.current.addEventListener('mousedown', handleClickOutsideAudioDropdown);
			}
			if (isVideoListOpen) {
				elRef.current.addEventListener('mousedown', handleClickOutsideVideoDropdown);
			}
		}

		return (): void => {
			if (elRef?.current) {
				elRef.current.removeEventListener('mousedown', handleClickOutsideAudioDropdown);
				elRef.current.removeEventListener('mousedown', handleClickOutsideVideoDropdown);
				elRef = null;
			}
		};
	}, [
		handleClickOutsideAudioDropdown,
		handleClickOutsideVideoDropdown,
		isAudioListOpen,
		isVideoListOpen,
		streamsWrapperRef
	]);

	useEffect(
		() => (): void => {
			timeout.current && clearTimeout(timeout.current);
		},
		[]
	);

	return (
		<BarContainer
			height="fit"
			$isHoovering={isHoovering}
			data-testid="meeting-action-bar"
			padding={{ horizontal: '3.25rem' }}
			orientation="horizontal"
		>
			<ActionsWrapper
				background="text"
				width="fit"
				height="fit"
				orientation="horizontal"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				<CameraButton
					isVideoListOpen={isVideoListOpen}
					videoDropdownRef={videoDropdownRef}
					setIsVideoListOpen={setIsVideoListOpen}
				/>
				<MicrophoneButton
					audioDropdownRef={audioDropdownRef}
					isAudioListOpen={isAudioListOpen}
					setIsAudioListOpen={setIsAudioListOpen}
				/>
				<ScreenShareButton />
				<FullScreenButton />
				<SwitchViewButton />
			</ActionsWrapper>
			<SecondActionsWrapper
				background="text"
				width="fit"
				height="fit"
				orientation="horizontal"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				<MeetingDuration meetingId={meetingId} />
				<LeaveMeetingButton isHoovering={isHoovering} />
			</SecondActionsWrapper>
		</BarContainer>
	);
};

export default MeetingActionsBar;
