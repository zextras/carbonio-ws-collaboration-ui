/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Padding } from '@zextras/carbonio-design-system';
import React, { ReactElement, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled, { FlattenSimpleInterpolation } from 'styled-components';

import CameraButton from './CameraButton';
import LeaveMeetingButton from './LeaveMeetingButton';
import MicrophoneButton from './MicrophoneButton';
import ScreenShareButton from './ScreenShareButton';
import SwitchViewButton from './SwitchViewButton';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import useStore from '../../../store/Store';

const BarContainer = styled(Container)`
	position: absolute;
	bottom: 0;
	width: 100%;
	transform: translateY(
		${({ isHoovering }): string | FlattenSimpleInterpolation => (isHoovering ? '-1rem' : '5rem')}
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

type MeetingActionsProps = {
	streamsWrapperRef: RefObject<HTMLDivElement>;
};

const MeetingActionsBar = ({ streamsWrapperRef }: MeetingActionsProps): ReactElement => {
	const [isHoovering, setIsHoovering] = useState<boolean>(false);
	const [isHoverActions, setIsHoverActions] = useState<boolean>(false);
	const [isAudioListOpen, setIsAudioListOpen] = useState<boolean>(false);
	const [isVideoListOpen, setIsVideoListOpen] = useState<boolean>(false);

	const audioDropdownRef = useRef<HTMLDivElement>(null);
	const videoDropdownRef = useRef<HTMLDivElement>(null);

	let timeout: string | number | NodeJS.Timeout | undefined;

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
			clearTimeout(timeout);
			if (!isHoovering) {
				setIsHoovering(true);
				if (!isHoverActions) {
					// eslint-disable-next-line react-hooks/exhaustive-deps
					timeout = setTimeout(() => {
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
		if (!isHoverActions) setIsHoovering(false);
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

	// TODO Only for grid tests
	const { meetingId }: MeetingRoutesParams = useParams();
	const [, setLastId] = useState<number>(0);
	const addParticipant = useCallback((): void => {
		setLastId((prev) => {
			useStore.getState().addParticipant(meetingId, {
				userId: (prev + 1).toString(),
				joinedAt: new Date().toISOString()
			});
			return prev + 1;
		});
	}, [meetingId]);

	const removeParticipant = useCallback((): void => {
		setLastId((prev) => {
			useStore.getState().removeParticipant(meetingId, prev.toString());
			return prev - 1;
		});
	}, [meetingId]);

	return (
		<BarContainer height="fit" isHoovering={isHoovering}>
			<ActionsWrapper
				background={'text'}
				width="fit"
				height="fit"
				orientation="horizontal"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				isHoovering={isHoovering}
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
				<SwitchViewButton />
				<Padding right="1rem" />
				<LeaveMeetingButton />

				<IconButton iconColor="gray6" icon="Plus" onClick={addParticipant} size="large" />
				<IconButton iconColor="gray6" icon="Minus" onClick={removeParticipant} size="large" />
			</ActionsWrapper>
		</BarContainer>
	);
};

export default MeetingActionsBar;
