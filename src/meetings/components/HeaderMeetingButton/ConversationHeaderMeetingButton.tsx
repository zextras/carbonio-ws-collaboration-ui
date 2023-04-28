/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Button,
	Container,
	IconButton,
	Padding,
	/* SnackbarManagerContext,
	CreateSnackbarFn, */
	Tooltip
} from '@zextras/carbonio-design-system';
import React, {
	ReactElement,
	useCallback,
	useEffect,
	/* useContext, */ useMemo,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components';

import ActiveMeetingParticipantsDropdown from './ActiveMeetingParticipantsDropdown';
import {
	getMeetingActive,
	getMyMeetingParticipation
} from '../../../store/selectors/MeetingSelectors';
import { getRoomNameSelector, getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';

const CustomButton = styled(Button)`
	padding: 0.125rem;
`;

const CustomVideoButton = styled(IconButton)`
	cursor: default;
	background-color: ${({ theme }): string => theme.palette.gray5.regular} !important;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray5.regular} !important;
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
	left: 0.063rem;
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
	const expandParticipantsListTooltip = t(
		'meeting.expandParticipantsListTooltip',
		'Expand active participants list'
	);
	const collapseParticipantsMeetingTooltip = t(
		'meeting.collapseParticipantsMeetingTooltip',
		'Collapse active participants list'
	);
	const ongoingOneToOneMeetingTooltip = t(
		'meeting.ongoingOneToOneMeetingTooltip',
		`You already have an active meeting with ${roomName}`,
		{ name: roomName }
	);
	const ongoingGroupMeetingTooltip = t(
		'meeting.ongoingGroupMeetingTooltip',
		'You are already participating in this meeting'
	);

	const roomType: RoomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const meetingIsActive: boolean = useStore((store) => getMeetingActive(store, roomId));
	const sessionId: string | undefined = useStore((store) => store.session.id);
	const amIParticipating: boolean = useStore((store) =>
		getMyMeetingParticipation(store, sessionId, roomId)
	);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	// const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	const openMeeting = useCallback(() => {
		window.open(`external/${roomId}`);
	}, [roomId]);

	// TODO for the copy link functionality just uncomment the sections
	/* const copyUrl = useCallback(() => {
		let url = document.location.href;
		const a = url.indexOf('chats/');
		url = url.slice(0, a);
		window.parent.navigator.clipboard.writeText(url.concat(`external/${roomId}`)).then(() => {
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

	const disableOngoingMeetingButton: boolean = useMemo(
		() => meetingIsActive && amIParticipating,
		[amIParticipating, meetingIsActive]
	);

	useEffect(() => {
		setIsDropdownOpen(false);
	}, [roomName]);

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
			<Tooltip
				label={
					meetingIsActive
						? amIParticipating
							? roomType === RoomType.ONE_TO_ONE
								? ongoingOneToOneMeetingTooltip
								: ongoingGroupMeetingTooltip
							: joinMeeting
						: startMeeting
				}
				placement="top"
			>
				<Container height="fit" width="fit">
					<CustomButton
						type="ghost"
						onClick={openMeeting}
						label={meetingIsActive ? joinMeeting : startMeeting}
						color="secondary"
						width="fit"
						disabled={disableOngoingMeetingButton}
					/>
				</Container>
			</Tooltip>
			{roomType !== RoomType.ONE_TO_ONE && meetingIsActive && (
				<Container orientation="horizontal" width="fit">
					<Container width="fit" padding={{ left: '0.5rem', right: '0.5rem' }}>
						<Container background="gray3" width="0.125rem" />
					</Container>
					<CustomActiveMeetingContainer width="fit">
						<CustomVideoButton
							iconColor="secondary"
							icon="VideoOutline"
							customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
						/>
						<ActiveMeetingDot />
					</CustomActiveMeetingContainer>
					<Padding right="0.5rem" />
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
						/>
					</Tooltip>
				</Container>
			)}
			{
				<ActiveMeetingParticipantsDropdown
					isDropdownOpen={isDropdownOpen}
					setIsDropdownOpen={setIsDropdownOpen}
					roomId={roomId}
				/>
			}
		</Container>
	);
};

export default ConversationHeaderMeetingButton;
