/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Padding } from '@zextras/carbonio-design-system';
import React, { ReactElement, RefObject, useCallback, useEffect, useState } from 'react';
import styled, { FlattenSimpleInterpolation } from 'styled-components';

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
	const [isHoovering, setIsHoovering] = useState(false);
	const [isHoverActions, setIsHoverActions] = useState(false);
	const [allowAudio, setAllowAudio] = useState(true);
	const [allowVideo, setAllowVideo] = useState(true);
	let timeout: string | number | NodeJS.Timeout | undefined;

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
		if (streamsWrapperRef && streamsWrapperRef.current) {
			streamsWrapperRef.current.removeEventListener('mousemove', handleHoverMouseMove);
		}
		if (!isHoverActions) setIsHoovering(false);
	}, [streamsWrapperRef, isHoverActions, handleHoverMouseMove]);

	const handleMouseEnter = useCallback(() => {
		setIsHoverActions(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setIsHoverActions(false);
	}, []);

	const toggleAudio = useCallback(() => {
		setAllowAudio(!allowAudio);
	}, [allowAudio, setAllowAudio]);

	const toggleVideo = useCallback(() => {
		setAllowVideo(!allowVideo);
	}, [allowVideo, setAllowVideo]);

	useEffect(() => {
		let elRef: React.RefObject<HTMLDivElement> | null = streamsWrapperRef;
		if (elRef && elRef.current && !isHoverActions) {
			elRef.current.addEventListener('mousemove', (e: MouseEvent) => handleHoverMouseMove(e));
			elRef.current.addEventListener('mouseStop', handleHoverMouseStop);
		}

		return (): void => {
			if (elRef && elRef.current) {
				elRef.current.removeEventListener('mousemove', handleHoverMouseMove);
				elRef.current.removeEventListener('mouseStop', handleHoverMouseStop);
				elRef = null;
			}
		};
	}, [handleHoverMouseMove, handleHoverMouseStop, isHoverActions, streamsWrapperRef]);

	return (
		<ActionsWrapper
			background="text"
			width="fit"
			height="fit"
			orientation="horizontal"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			isHoovering={isHoovering}
		>
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={allowAudio ? 'Mic' : 'MicOff'}
				onClick={toggleAudio}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon="Headphones"
				onClick={toggleVideo}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={allowVideo ? 'Video' : 'VideoOff'}
				onClick={toggleVideo}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={allowVideo ? 'ScreenSharingOn' : 'ScreenSharingOff'}
				onClick={toggleVideo}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon="MoreVertical"
				onClick={toggleVideo}
				size="large"
			/>
			<Padding right="48px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="error"
				icon="Hangup"
				onClick={toggleVideo}
				size="large"
			/>
		</ActionsWrapper>
	);
};

export default MeetingActions;
