/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ConversationInfoDetailsElement from './ConversationInfoDetailsElement';
import {
	getRoomDescriptionSelector,
	getRoomMembers
} from '../../../../store/selectors/RoomsSelectors';
import {
	getUserEmail,
	getUserName,
	getUserStatusMessage
} from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { Member, RoomType } from '../../../../types/store/RoomTypes';

type ConversationInfoDetailsProps = {
	roomId: string;
	roomType: string;
};

const CustomContainer = styled(Container)`
	max-height: 10.3125rem;
`;

const ConversationInfoDetails: FC<ConversationInfoDetailsProps> = ({ roomId, roomType }) => {
	const [t] = useTranslation();
	const nameLabel = t('conversationInfo.name', 'Name');
	const emailLabel = t('conversationInfo.email', 'Email');
	const topicLabel = t('conversationInfo.topic', 'Topic');
	const statusLabel = t('conversationInfo.status', 'Status');

	const sessionId: string | undefined = useStore((store) => store.session.id);
	const roomMembers: Member[] | undefined = useStore((state) => getRoomMembers(state, roomId));

	const memberId: string = useMemo(() => {
		if (roomType === RoomType.ONE_TO_ONE && roomMembers !== undefined) {
			if (roomMembers[0].userId === sessionId) return roomMembers[1]?.userId;
			return roomMembers[0].userId;
		}
		return '';
	}, [roomMembers, roomType, sessionId]);

	const memberName: string | undefined = useStore((state) =>
		roomType === RoomType.ONE_TO_ONE ? getUserName(state, memberId) : undefined
	);
	const roomTopic: string | undefined = useStore((state) =>
		getRoomDescriptionSelector(state, roomId)
	);

	const userStatusMessage: string | undefined = useStore((state) =>
		getUserStatusMessage(state, memberId)
	);
	const userEmail = useStore((state) => getUserEmail(state, memberId));

	if (roomType === RoomType.ONE_TO_ONE)
		return (
			<CustomContainer
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				padding={{ all: 'large' }}
				gap="0.5rem"
			>
				{roomType === RoomType.ONE_TO_ONE && (
					<>
						{userEmail && (
							<ConversationInfoDetailsElement
								label={userEmail}
								icon="EmailOutline"
								type={emailLabel}
							/>
						)}
						<ConversationInfoDetailsElement label={memberName} icon="AtOutline" type={nameLabel} />
						{userStatusMessage && (
							<ConversationInfoDetailsElement
								label={userStatusMessage}
								icon="InfoOutline"
								type={statusLabel}
							/>
						)}
					</>
				)}
			</CustomContainer>
		);

	if (roomType === RoomType.GROUP && roomTopic)
		return (
			<CustomContainer
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				padding={{ all: 'large' }}
				gap="small"
			>
				<ConversationInfoDetailsElement label={roomTopic} icon="InfoOutline" type={topicLabel} />
			</CustomContainer>
		);
	return null;
};

export default ConversationInfoDetails;
