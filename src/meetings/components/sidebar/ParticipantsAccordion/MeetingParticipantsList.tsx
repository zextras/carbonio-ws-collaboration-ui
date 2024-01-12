/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useMemo, useState } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { forEach, map, values } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import SearchUserAction from '../../../../chats/components/infoPanel/conversationParticipantsAccordion/SearchUserAction';
import { getMeetingParticipantsByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import { getUsersSelector } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { MeetingParticipant, MeetingParticipantMap } from '../../../../types/store/MeetingTypes';
import { UsersMap } from '../../../../types/store/UserTypes';
import ParticipantElement from '../../headerMeetingButton/ParticipantElement';

type ParticipantsListProps = {
	meetingId: string;
};

const CustomContainer = styled(Container)`
	cursor: default;
`;

const ListContainer = styled(Container)`
	overflow-y: scroll;
`;

const MeetingParticipantsList: FC<ParticipantsListProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');
	const meetingParticipants: MeetingParticipantMap | undefined = useStore((store) =>
		getMeetingParticipantsByMeetingId(store, meetingId)
	);
	const users: UsersMap = useStore(getUsersSelector);
	const [filteredContactList, setFilteredContactList] = useState<MeetingParticipant[] | undefined>(
		values(meetingParticipants)
	);
	const [filteredInput, setFilteredInput] = useState('');

	useEffect(() => {
		if (filteredInput === '') {
			setFilteredContactList(values(meetingParticipants));
		} else {
			const filteredMembers: MeetingParticipant[] = [];
			forEach(meetingParticipants, (member: MeetingParticipant) => {
				if (
					users[member.userId].name
						?.toLocaleLowerCase()
						.includes(filteredInput.toLocaleLowerCase()) ||
					users[member.userId].email
						?.toLocaleLowerCase()
						.includes(filteredInput.toLocaleLowerCase())
				) {
					filteredMembers.push(member);
				}
			});
			setFilteredContactList(filteredMembers);
		}
	}, [filteredInput, meetingParticipants, users]);

	const listOfMembers = useMemo(
		() =>
			map(filteredContactList, (member: MeetingParticipant) => (
				<ParticipantElement
					key={member.userId}
					memberId={member.userId}
					meetingId={meetingId}
					isInsideMeeting
				/>
			)),
		[filteredContactList, meetingId]
	);

	const memberList = useMemo(
		() =>
			filteredContactList !== undefined &&
			(filteredContactList.length !== 0 ? (
				<ListContainer
					data-testid="meeting_participants_list"
					maxHeight={'28.25rem'}
					crossAlignment="flex-start"
					mainAlignment="flex-start"
				>
					{listOfMembers}
				</ListContainer>
			) : (
				<CustomContainer padding="large">
					<Text color="gray1" size="small" weight="light">
						{noMatchLabel}
					</Text>
				</CustomContainer>
			)),
		[filteredContactList, listOfMembers, noMatchLabel]
	);

	return (
		<Container padding={{ right: 'small' }}>
			<SearchUserAction setFilteredInput={setFilteredInput} isInsideMeeting />
			<Container height="fit" padding={{ bottom: '0.75rem' }}>
				{memberList}
			</Container>
		</Container>
	);
};

export default MeetingParticipantsList;
