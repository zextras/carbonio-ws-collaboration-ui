/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Padding } from '@zextras/carbonio-design-system';
import React, { ReactElement, RefObject, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled, { FlattenSimpleInterpolation } from 'styled-components';

import useRouting, { PAGE_INFO_TYPE } from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';

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
	const { goToInfoPage } = useRouting();
	const { meetingId }: any = useParams();

	const [isHoovering, setIsHoovering] = useState(false);
	const [isHoverActions, setIsHoverActions] = useState(false);
	const [videoStatus, setVideoStatus] = useState(false);
	const [audioStatus, setAudioStatus] = useState(false);
	const [shareStatus, setShareStatus] = useState(false);
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

	const toggleVideoStream = useCallback(() => {
		if (!videoStatus) {
			MeetingsApi.openVideoStream(meetingId).then(() => setVideoStatus(!videoStatus));
		} else {
			MeetingsApi.closeVideoStream(meetingId).then(() => setVideoStatus(!videoStatus));
		}
	}, [videoStatus, meetingId]);

	const toggleAudioStream = useCallback(() => {
		if (!audioStatus) {
			MeetingsApi.openAudioStream(meetingId).then(() => setAudioStatus(!audioStatus));
		} else {
			MeetingsApi.closeAudioStream(meetingId).then(() => setAudioStatus(!audioStatus));
		}
	}, [audioStatus, meetingId]);

	const toggleShareStream = useCallback(() => {
		if (!shareStatus) {
			MeetingsApi.openScreenShareStream(meetingId).then(() => setShareStatus(!shareStatus));
		} else {
			MeetingsApi.closeScreenShareStream(meetingId).then(() => setShareStatus(!shareStatus));
		}
	}, [shareStatus, meetingId]);

	const leaveMeeting = useCallback(() => {
		MeetingsApi.leaveMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [meetingId, goToInfoPage]);

	const deleteMeeting = useCallback(() => {
		MeetingsApi.deleteMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [meetingId, goToInfoPage]);

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
				icon={audioStatus ? 'Mic' : 'MicOff'}
				onClick={toggleAudioStream}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon="Headphones"
				onClick={deleteMeeting}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={videoStatus ? 'Video' : 'VideoOff'}
				onClick={toggleVideoStream}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={shareStatus ? 'ScreenSharingOn' : 'ScreenSharingOff'}
				onClick={toggleShareStream}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon="MoreVertical"
				onClick={deleteMeeting}
				size="large"
			/>
			<Padding right="48px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="error"
				icon="Hangup"
				onClick={leaveMeeting}
				size="large"
			/>
		</ActionsWrapper>
	);
};

export default MeetingActions;
