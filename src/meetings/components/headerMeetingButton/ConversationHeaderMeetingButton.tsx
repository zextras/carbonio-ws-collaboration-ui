/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Container, Icon, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components';

import ActiveMeetingParticipantsDropdown from './ActiveMeetingParticipantsDropdown';
import useRoomMeeting from '../../../hooks/useRoomMeeting';
import {
	getMeetingActive,
	getMyMeetingParticipation,
	getNumberOfMeetingParticipants
} from '../../../store/selectors/MeetingSelectors';
import { getRoomNameSelector, getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';

const CustomButton = styled(Button)`
	padding: 0.125rem 0.5rem;
`;

const CustomActiveMeetingContainer = styled(Container)`
	position: relative;
`;

const ActiveMeetingDot = styled.div`
	position: absolute;
	width: 0.313rem;
	height: 0.313rem;
	background-color: ${({ theme }: { theme: DefaultTheme }): string => theme.palette.error.regular};
	border: 0.0625rem solid ${(props): string => props.theme.palette.error.regular};
	border-radius: 50%;
	left: 0;
	top: 0.188rem;
	animation: blink 1.5s linear infinite;

	@keyframes blink {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
		100% {
			opacity: 1;
		}
	}
`;

type ConversationHeaderMeetingButtonProps = {
	roomId: string;
};

const ConversationHeaderMeetingButton = ({
	roomId
}: ConversationHeaderMeetingButtonProps): ReactElement => {
	const [t] = useTranslation();

	const roomName: string = useStore((store) => getRoomNameSelector(store, roomId)) || '';

	const startMeeting = t('meeting.startMeeting', 'Start meeting');
	const joinMeeting = t('meeting.joinMeeting', 'Join meeting');
	const restartMeeting = t('meeting.restartMeeting', 'Restart meeting');
	const rejoinMeeting = t('meeting.rejoinMeeting', 'Rejoin meeting');
	const activeSessionTooltip = t(
		'meeting.tooltip.activeSessionTooltip',
		'You have an active session in this meeting'
	);
	const expandParticipantsListTooltip = t(
		'meeting.expandParticipantsListTooltip',
		'Expand participants list'
	);
	const collapseParticipantsMeetingTooltip = t(
		'meeting.collapseParticipantsMeetingTooltip',
		'Collapse participants list'
	);
	const activeMeetingTooltip = t(
		'meeting.activeMeetingTooltip',
		"There's an active meeting for this Chat"
	);

	const roomType: RoomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const meetingIsActive: boolean = useStore((store) => getMeetingActive(store, roomId));
	const amIParticipating: boolean = useStore((store) => getMyMeetingParticipation(store, roomId));
	const meetingParticipantsNumber = useStore((store) =>
		getNumberOfMeetingParticipants(store, roomId)
	);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const ref = useRef<HTMLDivElement>(null);

	const { openMeeting } = useRoomMeeting(roomId);

	const meetingButtonLabel = useMemo(
		() =>
			meetingIsActive
				? amIParticipating
					? meetingParticipantsNumber === 1
						? restartMeeting
						: rejoinMeeting
					: joinMeeting
				: startMeeting,
		[
			amIParticipating,
			joinMeeting,
			meetingIsActive,
			meetingParticipantsNumber,
			rejoinMeeting,
			restartMeeting,
			startMeeting
		]
	);

	const toggleDropdown = useCallback(() => {
		setIsDropdownOpen((prevState) => !prevState);
	}, [setIsDropdownOpen]);

	const closeDropdown = useCallback(
		(event) => {
			if (ref.current && !ref.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		},
		[setIsDropdownOpen, ref]
	);

	useEffect(() => {
		setIsDropdownOpen(false);
	}, [roomName]);

	useEffect(() => {
		document.addEventListener('click', closeDropdown, true);
		return () => {
			document.removeEventListener('click', closeDropdown, true);
		};
	}, [closeDropdown, ref]);

	return (
		<Container orientation="horizontal" data-testid="ConversationHeaderMeetingButton">
			<Tooltip label={activeSessionTooltip} placement="top" disabled={!amIParticipating}>
				<CustomButton
					onClick={openMeeting}
					label={meetingButtonLabel}
					color="secondary"
					width="fit"
					data-testid="join_meeting_button"
				/>
			</Tooltip>
			{meetingIsActive && (
				<Container orientation="horizontal" width="fit" gap="0.5rem" padding={{ left: '1rem' }}>
					<Tooltip label={activeMeetingTooltip} placement="top">
						<CustomActiveMeetingContainer width="fit">
							<Icon color="secondary" icon="VideoOutline" size="large" data-testid="video_button" />
							<ActiveMeetingDot />
						</CustomActiveMeetingContainer>
					</Tooltip>
					{roomType === RoomType.GROUP && (
						<Tooltip
							label={
								isDropdownOpen ? collapseParticipantsMeetingTooltip : expandParticipantsListTooltip
							}
							placement="top"
						>
							<IconButton
								icon={isDropdownOpen ? 'ChevronUp' : 'ChevronDown'}
								iconColor="secondary"
								customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
								onClick={toggleDropdown}
								data-testid="participant_list_button"
							/>
						</Tooltip>
					)}
				</Container>
			)}
			<Container ref={ref} width="fit" height="fit">
				<ActiveMeetingParticipantsDropdown
					isDropdownOpen={isDropdownOpen}
					setIsDropdownOpen={setIsDropdownOpen}
					roomId={roomId}
				/>
			</Container>
		</Container>
	);
};

export default ConversationHeaderMeetingButton;
