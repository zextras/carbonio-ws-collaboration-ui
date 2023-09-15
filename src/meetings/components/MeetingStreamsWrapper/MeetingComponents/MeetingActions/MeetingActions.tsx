/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Padding } from '@zextras/carbonio-design-system';
import React, { ReactElement, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import styled, { FlattenSimpleInterpolation } from 'styled-components';

import CameraButton from './CameraButton';
import LeaveMeetingButton from './LeaveMeetingButton';
import MicrophoneButton from './MicrophoneButton';
/* import {
	 getMeetingViewSelected, 
} from '../../../../../store/selectors/ActiveMeetingSelectors'; */

const ActionsWrapper = styled(Container)`
	position: absolute;
	bottom: 0;
	left: calc(50% - 180px);
	transform: translateY(
		${({ isHoovering }): string | FlattenSimpleInterpolation => (isHoovering ? '-1rem' : '5rem')}
	);
	transition: transform 200ms linear;
	z-index: 40;
	padding: 1rem;
	border-radius: 0.5rem;
`;

type MeetingActionsProps = {
	streamsWrapperRef: RefObject<HTMLDivElement>;
};

const MeetingActions = ({ streamsWrapperRef }: MeetingActionsProps): ReactElement => {
	// const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));

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

	/*
	const deleteMeeting = useCallback(() => {
		MeetingsApi.deleteMeeting(meetingId).then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED));
	}, [meetingId, goToInfoPage]);

	const toggleMeetingView = useCallback(() => {
		setMeetingViewSelected(
			meetingId,
			meetingViewSelected === MeetingViewType.GRID ? MeetingViewType.CINEMA : MeetingViewType.GRID
		);
	}, [meetingId, meetingViewSelected, setMeetingViewSelected]);
	*/

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

	return (
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
			<Padding right="1rem" />
			<MicrophoneButton
				audioDropdownRef={audioDropdownRef}
				isAudioListOpen={isAudioListOpen}
				setIsAudioListOpen={setIsAudioListOpen}
			/>

			{/* 
			<Padding right="1rem" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon="ScreenSharingOff" // TODO shareStatus ? 'ScreenSharingOn' : 'ScreenSharingOff'}
				onClick={(): null => null}
				size="large"
				disabled // TODO: enable when screen sharing will be available
			/>
			<Padding right="1rem" />
			<IconButton
				size="large"
				backgroundColor="primary"
				iconColor="gray6"
				icon={meetingViewSelected === MeetingViewType.GRID ? "Grid" : "CinemaView"}
				onClick={toggleMeetingView}
				disabled // TODO: enable when grid mode will be available
			/>
			<Padding right="16px" />;
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon="MoreVertical"
				onClick={deleteMeeting}
				size="large"
			/>
		*/}
			<Padding right="3rem" />
			<LeaveMeetingButton />
		</ActionsWrapper>
	);
};

export default MeetingActions;