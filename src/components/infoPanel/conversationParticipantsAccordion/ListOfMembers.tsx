/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { FC } from 'react';

import { Member } from '../../../types/store/RoomTypes';
import ParticipantComponentInfo from './ParticipantComponentInfo';

type ListOfMembersProps = {
	roomId: string;
	contactList: Member[] | undefined;
};

const ListOfMembers: FC<ListOfMembersProps> = ({ roomId, contactList }) => {
	const listOfMembers = map(contactList, (member: Member) => (
		<ParticipantComponentInfo key={member.userId} member={member} roomId={roomId} />
	));

	return <Container data-testid="conversation_list">{listOfMembers}</Container>;
};

export default ListOfMembers;
