/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Button,
	Container,
	Icon,
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
	useRef,
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
	const expandParticipantsListTooltip = t(
		'meeting.expandParticipantsListTooltip',
		'Expand participants list'
	);
	const collapseParticipantsMeetingTooltip = t(
		'meeting.collapseParticipantsMeetingTooltip',
		'Collapse participants list'
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

	const disableOngoingMeetingButton: boolean = useMemo(
		() => meetingIsActive && amIParticipating,
		[amIParticipating, meetingIsActive]
	);

	const meetingButtonTooltip = useMemo(
		() =>
			meetingIsActive
				? amIParticipating
					? roomType === RoomType.ONE_TO_ONE
						? ongoingOneToOneMeetingTooltip
						: ongoingGroupMeetingTooltip
					: joinMeeting
				: startMeeting,
		[
			amIParticipating,
			joinMeeting,
			meetingIsActive,
			ongoingGroupMeetingTooltip,
			ongoingOneToOneMeetingTooltip,
			roomType,
			startMeeting
		]
	);

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
			<Tooltip label={meetingButtonTooltip} placement="top" maxWidth="40rem">
				<Container height="fit" width="fit">
					<CustomButton
						onClick={openMeeting}
						label={meetingIsActive ? joinMeeting : startMeeting}
						color="secondary"
						width="fit"
						disabled={disableOngoingMeetingButton}
						data-testid="join_meeting_button"
					/>
				</Container>
			</Tooltip>
			{roomType !== RoomType.ONE_TO_ONE && meetingIsActive && (
				<Container orientation="horizontal" width="fit">
					<Container width="fit" padding={{ left: '0.5rem', right: '0.5rem' }}>
						<Container background="gray3" width="0.063rem" />
					</Container>
					<Tooltip label={activeMeetingTooltip} placement="top">
						<CustomActiveMeetingContainer width="fit">
							<Icon color="secondary" icon="VideoOutline" size="large" data-testid="video_button" />
							<ActiveMeetingDot />
						</CustomActiveMeetingContainer>
					</Tooltip>
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
							data-testid="participant_list_button"
						/>
					</Tooltip>
				</Container>
			)}
			{
				<Container ref={ref} width="fit" height="fit">
					<ActiveMeetingParticipantsDropdown
						isDropdownOpen={isDropdownOpen}
						setIsDropdownOpen={setIsDropdownOpen}
						roomId={roomId}
					/>
				</Container>
			}
		</Container>
	);
};

export default ConversationHeaderMeetingButton;
