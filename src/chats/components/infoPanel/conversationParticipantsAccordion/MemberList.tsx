/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useState, useMemo, useEffect } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { forEach } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ListOfMembers from './ListOfMembers';
import SearchUserAction from './SearchUserAction';
import { getRoomMembers } from '../../../../store/selectors/RoomsSelectors';
import { getUsersSelector } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { Member } from '../../../../types/store/RoomTypes';
import { UsersMap } from '../../../../types/store/UserTypes';

type ParticipantsListProps = {
	roomId: string;
};

const CustomContainer = styled(Container)`
	cursor: default;
`;

const MemberList: FC<ParticipantsListProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');
	const members: Member[] | undefined = useStore((state) => getRoomMembers(state, roomId));
	const users: UsersMap = useStore(getUsersSelector);
	const [filteredContactList, setFilteredContactList] = useState<Member[] | undefined>([]);
	const [filteredInput, setFilteredInput] = useState('');

	useEffect(() => {
		if (filteredInput === '') {
			setFilteredContactList(members);
		} else {
			const filteredMembers: Member[] = [];
			forEach(members, (member) => {
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
	}, [filteredInput, members, users]);

	const memberList = useMemo(
		() =>
			filteredContactList !== undefined &&
			(filteredContactList?.length !== 0 ? (
				<ListOfMembers contactList={filteredContactList} roomId={roomId} />
			) : (
				<CustomContainer padding="large">
					<Text color="gray1" size="small" weight="light">
						{noMatchLabel}
					</Text>
				</CustomContainer>
			)),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[members, filteredContactList]
	);

	return (
		<Container padding={{ right: 'small' }}>
			<SearchUserAction setFilteredInput={setFilteredInput} />
			{memberList}
		</Container>
	);
};

export default MemberList;
