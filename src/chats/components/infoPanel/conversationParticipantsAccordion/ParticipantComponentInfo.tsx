/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Avatar, Container, Padding, Text, Shimmer, Row } from '@zextras/carbonio-design-system';
import moment from 'moment-timezone';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ParticipantComponentActions from './ParticipantComponentActions';
import { UsersApi } from '../../../../network';
import { getCapability } from '../../../../store/selectors/SessionSelectors';
import {
	getUserEmail,
	getUserLastActivity,
	getUserName,
	getUserOnline,
	getUserPictureUpdatedAt
} from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { Member } from '../../../../types/store/RoomTypes';
import { CapabilityType } from '../../../../types/store/SessionTypes';

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

const ParticipantComponentInfo: FC<ParticipantsInfoProps> = ({ member, roomId }) => {
	const [t] = useTranslation();
	const userOnlineLabel: string = t('status.online', 'Online');
	const userOfflineLabel: string = t('status.offline', 'Offline');

	const memberName: string | undefined = useStore((store) => getUserName(store, member.userId));
	const memberEmail: string | undefined = useStore((store) => getUserEmail(store, member.userId));
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

	const [picture, setPicture] = useState<false | string>(false);

	useEffect(() => {
		if (userPictureUpdatedAt != null) {
			setPicture(`${UsersApi.getURLUserPicture(member.userId)}?${userPictureUpdatedAt}`);
		} else {
			setPicture(false);
		}
	}, [member, userPictureUpdatedAt]);

	const lastSeen: string | undefined = useMemo(() => {
		if (memberLastActivity) {
			return moment(memberLastActivity).calendar().toLocaleLowerCase();
		}
		return undefined;
	}, [memberLastActivity]);
	const lastSeenLabel: string = t('status.lastSeen', `Last Seen ${lastSeen}`, { lastSeen });

	const presenceLabel = useMemo(
		() => (memberOnline ? userOnlineLabel : memberLastActivity ? lastSeenLabel : userOfflineLabel),
		[memberOnline, memberLastActivity, userOnlineLabel, lastSeenLabel, userOfflineLabel]
	);

	const avatarElement = useMemo(
		() =>
			memberName == null && memberEmail == null ? (
				<Container width="fit" height="fit">
					<Shimmer.Avatar height="2rem" width="2rem" />
				</Container>
			) : (
				<CustomAvatar label={memberName || memberEmail} shape="round" picture={picture} />
			),
		[memberEmail, memberName, picture]
	);

	const infoElement = useMemo(
		() => (
			<Row takeAvailableSpace wrap="nowrap" height="100%">
				<Container orientation="vertical" crossAlignment="flex-start" padding={{ left: 'small' }}>
					<Text color="text" size="small" overflow="ellipsis">
						{memberName}
					</Text>
					<Padding top="extrasmall" />
					{canSeeUsersPresence && (
						<Text size="extrasmall" color="secondary" overflow="ellipsis">
							{presenceLabel}
						</Text>
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
			{avatarElement}
			{infoElement}
			<Row>
				<ParticipantComponentActions roomId={roomId} memberId={member.userId} />
			</Row>
		</CustomContainer>
	);
};

export default ParticipantComponentInfo;
