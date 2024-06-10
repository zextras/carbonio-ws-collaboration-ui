/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import {
	Avatar,
	Container,
	Padding,
	Text,
	Row,
	TextWithTooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import MemberComponentActions from './MemberComponentActions';
import { UsersApi } from '../../../../network';
import { getCapability } from '../../../../store/selectors/SessionSelectors';
import {
	getAreUserInfoAvailable,
	getUserLastActivity,
	getUserName,
	getUserOnline,
	getUserPictureUpdatedAt
} from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { Member } from '../../../../types/store/RoomTypes';
import { CapabilityType } from '../../../../types/store/SessionTypes';
import { getCalendarTime } from '../../../../utils/dateUtils';

type ParticipantsInfoProps = {
	member: Member;
	roomId: string;
};

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomAvatar = styled(Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

const MemberComponentInfo: FC<ParticipantsInfoProps> = ({ member, roomId }) => {
	const [t] = useTranslation();
	const userOnlineLabel: string = t('status.online', 'Online');
	const youLabel = t('status.you', 'You');
	const goToPrivateChatLabel = t(
		'status.goToPrivateChat',
		'Go to private chat to send a personal message'
	);

	const sessionId: string | undefined = useStore.getState().session.id;
	const areUserInfoAvailable = useStore((store) => getAreUserInfoAvailable(store, member.userId));
	const memberName: string = useStore((store) => getUserName(store, member.userId));
	const memberLastActivity: number | undefined = useStore((store) =>
		getUserLastActivity(store, member.userId)
	);
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, member.userId)
	);
	const memberOnline: boolean | undefined = useStore((store) =>
		getUserOnline(store, member.userId)
	);
	const canSeeUsersPresence = useStore((store) =>
		getCapability(store, CapabilityType.CAN_SEE_USERS_PRESENCE)
	);

	const picture = useMemo(() => {
		if (userPictureUpdatedAt != null) {
			return `${UsersApi.getURLUserPicture(member.userId)}?${userPictureUpdatedAt}`;
		}
		return '';
	}, [member, userPictureUpdatedAt]);

	const lastSeen: string = useMemo(
		() => (memberLastActivity ? getCalendarTime(memberLastActivity) : ''),
		[memberLastActivity]
	);

	const lastSeenLabel: string = t('status.lastSeen', `Last Seen ${lastSeen}`, { lastSeen });

	const presenceLabel = useMemo(() => {
		if (sessionId === member.userId) return youLabel;
		if (memberOnline) return userOnlineLabel;
		if (memberLastActivity) return lastSeenLabel;
		return goToPrivateChatLabel;
	}, [
		sessionId,
		member.userId,
		youLabel,
		memberOnline,
		userOnlineLabel,
		memberLastActivity,
		lastSeenLabel,
		goToPrivateChatLabel
	]);

	const infoElement = useMemo(
		() => (
			<Row takeAvailableSpace wrap="nowrap" height="100%">
				<Container orientation="vertical" crossAlignment="flex-start" padding={{ left: 'small' }}>
					<Text color="text" size="small" overflow="ellipsis">
						{memberName}
					</Text>
					<Padding top="extrasmall" />
					{canSeeUsersPresence && (
						<TextWithTooltip size="extrasmall" color="secondary">
							{presenceLabel}
						</TextWithTooltip>
					)}
				</Container>
			</Row>
		),
		[canSeeUsersPresence, memberName, presenceLabel]
	);

	return (
		<CustomContainer
			orientation="horizontal"
			width="fill"
			padding={{ top: 'extrasmall', bottom: 'extrasmall' }}
		>
			<CustomAvatar
				label={memberName}
				shape="round"
				picture={picture}
				icon={!areUserInfoAvailable ? 'QuestionMarkCircleOutline' : undefined}
			/>
			{infoElement}
			<Row>
				<MemberComponentActions roomId={roomId} memberId={member.userId} />
			</Row>
		</CustomContainer>
	);
};

export default MemberComponentInfo;
