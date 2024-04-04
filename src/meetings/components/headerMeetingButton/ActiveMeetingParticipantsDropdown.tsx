/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Dispatch, ReactElement, SetStateAction, useEffect, useMemo } from 'react';

import { Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ParticipantElement from './ParticipantElement';
import {
	getMeetingParticipants,
	getNumberOfMeetingParticipants
} from '../../../store/selectors/MeetingSelectors';
import { getMeetingIdFromRoom } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { MeetingParticipant, MeetingParticipantMap } from '../../../types/store/MeetingTypes';
import MeetingDuration from '../meetingActionsBar/MeetingDuration';

const CustomContainer = styled(Container)<{ $isDropdownOpen: boolean }>`
	position: absolute;
	z-index: ${({ $isDropdownOpen }): string => ($isDropdownOpen ? '11' : '-1')};
	top: 3.5rem;
	right: 1rem;
	box-shadow: 0 0 0.25rem rgba(166, 166, 166, 0.5);
	border-radius: 1rem;
	opacity: ${({ $isDropdownOpen }): string => ($isDropdownOpen ? '1' : '0')};
`;

const ListContainer = styled(Container)`
	overflow-y: scroll;
`;

type ActiveMeetingParticipantsDropdownProps = {
	isDropdownOpen: boolean;
	setIsDropdownOpen: Dispatch<SetStateAction<boolean>>;
	roomId: string;
};
const ActiveMeetingParticipantsDropdown = ({
	isDropdownOpen,
	setIsDropdownOpen,
	roomId
}: ActiveMeetingParticipantsDropdownProps): ReactElement => {
	const [t] = useTranslation();

	const numberOfParticipants = useStore((store) => getNumberOfMeetingParticipants(store, roomId));
	const meetingParticipants: MeetingParticipantMap | undefined = useStore((store) =>
		getMeetingParticipants(store, roomId)
	);
	const meetingId = useStore((store) => getMeetingIdFromRoom(store, roomId));

	const participantsTitle = t(
		'meeting.participantsList.title',
		"{{count}} meeting's participants",
		{ count: numberOfParticipants !== undefined ? numberOfParticipants : 0 }
	);

	const listOfMembers = useMemo(
		() =>
			map(meetingParticipants, (member: MeetingParticipant) => (
				<ParticipantElement key={member.userId} memberId={member.userId} />
			)),
		[meetingParticipants]
	);

	useEffect(() => {
		if (isDropdownOpen && numberOfParticipants === 0) {
			setIsDropdownOpen(false);
		}
	}, [isDropdownOpen, numberOfParticipants, setIsDropdownOpen]);

	return (
		<CustomContainer
			id="meeting-list-dropdown"
			background="gray5"
			width="20rem"
			$isDropdownOpen={isDropdownOpen}
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			padding={{ horizontal: '1rem', bottom: '0.75rem', top: '1rem' }}
			height="fit"
			maxHeight="50%"
			data-testid="participant_dropdown"
		>
			<Container
				width="fill"
				height="fit"
				orientation="horizontal"
				mainAlignment="space-between"
				padding={{ bottom: '0.5rem' }}
			>
				<Text color="gray0" size="small">
					{participantsTitle}
				</Text>
				<MeetingDuration meetingId={meetingId} />
			</Container>
			<Divider />
			<Padding bottom="0.75rem" />
			<ListContainer
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				data-testid="participant_list"
			>
				{listOfMembers}
			</ListContainer>
		</CustomContainer>
	);
};

export default ActiveMeetingParticipantsDropdown;
