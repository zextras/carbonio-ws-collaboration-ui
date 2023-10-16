/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { map } from 'lodash';

import MemberComponentInfo from './MemberComponentInfo';
import { Member } from '../../../../types/store/RoomTypes';

type ListOfMembersProps = {
	roomId: string;
	contactList: Member[] | undefined;
};

const ListOfMembers: FC<ListOfMembersProps> = ({ roomId, contactList }) => {
	const listOfMembers = map(contactList, (member: Member) => (
		<MemberComponentInfo key={member.userId} member={member} roomId={roomId} />
	));

	return <Container data-testid="members_list">{listOfMembers}</Container>;
};

export default ListOfMembers;
