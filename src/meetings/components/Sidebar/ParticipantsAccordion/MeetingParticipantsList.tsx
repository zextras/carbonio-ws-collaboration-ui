/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Text } from '@zextras/carbonio-design-system';
import { forEach, map } from 'lodash';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import SearchUserAction from '../../../../chats/components/infoPanel/conversationParticipantsAccordion/SearchUserAction';
import { usersNameListEqualityFn } from '../../../../store/equalityFunctions/UsersEqualityFunctions';
import { getMeetingParticipantsByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import { getUsersSelector } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { MeetingParticipant, MeetingParticipantMap } from '../../../../types/store/MeetingTypes';
import { UsersMap } from '../../../../types/store/UserTypes';
import ParticipantElement from '../../HeaderMeetingButton/ParticipantElement';

type ParticipantsListProps = {
	meetingId: string;
};

const CustomContainer = styled(Container)`
	cursor: default;
`;

const MeetingParticipantsList: FC<ParticipantsListProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');
	const meetingParticipants: MeetingParticipantMap | undefined = useStore((store) =>
		getMeetingParticipantsByMeetingId(store, meetingId)
	);
	const users: UsersMap = useStore(getUsersSelector, usersNameListEqualityFn);
	const [filteredContactList, setFilteredContactList] = useState<
		MeetingParticipant[] | MeetingParticipantMap | undefined
	>();
	const [filteredInput, setFilteredInput] = useState('');

	useEffect(() => {
		if (filteredInput === '') {
			setFilteredContactList(meetingParticipants);
		} else {
			const filteredMembers: MeetingParticipant[] = [];
			forEach(meetingParticipants, (member: MeetingParticipant) => {
				if (
					users[member.userId].name?.toLocaleLowerCase().includes(filteredInput.toLocaleLowerCase())
				) {
					console.log(users[member.userId].name);
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
					key={`${member.userId}-${member.sessionId}`}
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
				<Container data-testid="meeting_participants_list">{listOfMembers}</Container>
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
			{memberList}
		</Container>
	);
};

export default MeetingParticipantsList;
