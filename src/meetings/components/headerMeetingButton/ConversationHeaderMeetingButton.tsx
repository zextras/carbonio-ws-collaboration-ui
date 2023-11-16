/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';

import { Button, Container, Icon, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components';

import ActiveMeetingParticipantsDropdown from './ActiveMeetingParticipantsDropdown';
import { MEETINGS_PATH } from '../../../constants/appConstants';
import {
	getMeetingActive,
	getMyMeetingParticipation
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

// type CreateSnackbarFn = typeof CreateSnackbarFn;

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
		"There's an active meeting for this Group"
	);

	const roomType: RoomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const meetingIsActive: boolean = useStore((store) => getMeetingActive(store, roomId));
	const amIParticipating: boolean = useStore((store) => getMyMeetingParticipation(store, roomId));

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const ref = useRef<HTMLDivElement>(null);

	// const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	const openMeeting = useCallback(() => window.open(`${MEETINGS_PATH}${roomId}`), [roomId]);

	// TODO for the copy link functionality just uncomment the sections
	/* const copyUrl = useCallback(() => {
		let url = document.location.href;
		const a = url.indexOf('chats/');
		url = url.slice(0, a);
		window.parent.navigator.clipboard.writeText(url.concat(`${MEETINGS_PATH}${roomId}`)).then(() => {
			createSnackbar({
				key: new Date().toLocaleString(),
				type: 'info',
				label: 'Meeting's link copied!'
			});
		});
	}, [createSnackbar, roomId]); */

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
		<Container orientation="horizontal">
			{/* {roomType === RoomType.GROUP && (
				<Container orientation="horizontal" width="fit">
					<IconButton
						iconColor="secondary"
						icon="Link2Outline"
						customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
						onClick={copyUrl}
					/>
					<Padding right="0.5rem" />
				</Container>
			)} */}
			<CustomButton
				onClick={openMeeting}
				label={
					meetingIsActive
						? roomType === RoomType.GROUP
							? joinMeeting
							: restartMeeting
						: startMeeting
				}
				color="secondary"
				width="fit"
				data-testid="join_meeting_button"
			/>
			{meetingIsActive &&
				(roomType === RoomType.GROUP ? (
					<Container orientation="horizontal" width="fit" gap="0.5rem" padding={{ left: '1rem' }}>
						{amIParticipating && (
							<Tooltip label={activeSessionTooltip}>
								<Container width="fit">
									<Icon size="large" icon="CastOutline" color="secondary" />
								</Container>
							</Tooltip>
						)}
						<Tooltip label={activeMeetingTooltip} placement="top">
							<CustomActiveMeetingContainer width="fit">
								<Icon
									color="secondary"
									icon="VideoOutline"
									size="large"
									data-testid="video_button"
								/>
								<ActiveMeetingDot />
							</CustomActiveMeetingContainer>
						</Tooltip>
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
					</Container>
				) : (
					amIParticipating && (
						<Container orientation="horizontal" width="fit" gap="0.5rem" padding={{ left: '1rem' }}>
							<Tooltip label={activeSessionTooltip}>
								<Icon size="large" icon="CastOutline" color="secondary" />
							</Tooltip>
						</Container>
					)
				))}
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
