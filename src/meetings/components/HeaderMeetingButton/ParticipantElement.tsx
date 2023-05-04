/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Avatar, Container, Text, Shimmer, Row } from '@zextras/carbonio-design-system';
import React, { FC, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import GoToPrivateChatAction from '../../../chats/components/infoPanel/conversationParticipantsAccordion/GoToPrivateChatAction';
import { UsersApi } from '../../../network';
import {
	getUserEmail,
	getUserName,
	getUserPictureUpdatedAt
} from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomAvatar = styled(Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

type ParticipantElementProps = {
	memberId: string;
};

const ParticipantElement: FC<ParticipantElementProps> = ({ memberId }) => {
	const memberName: string | undefined = useStore((store) => getUserName(store, memberId));
	const memberEmail: string | undefined = useStore((store) => getUserEmail(store, memberId));
	const sessionId: string | undefined = useStore((state) => state.session.id);
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, memberId)
	);

	const [picture, setPicture] = useState<false | string>(false);

	useEffect(() => {
		if (userPictureUpdatedAt != null) {
			setPicture(`${UsersApi.getURLUserPicture(memberId)}?${userPictureUpdatedAt}`);
		} else {
			setPicture(false);
		}
	}, [memberId, userPictureUpdatedAt]);

	const isSessionParticipant: boolean = useMemo(
		() => memberId === sessionId,
		[memberId, sessionId]
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
				</Container>
			</Row>
		),
		[memberName]
	);

	return (
		<CustomContainer
			orientation="horizontal"
			width="fill"
			padding={{ top: 'extrasmall', bottom: 'extrasmall' }}
		>
			{avatarElement}
			{infoElement}
			{!isSessionParticipant && (
				<Row>
					<GoToPrivateChatAction
						memberId={memberId}
						isParticipantMeeting
						data-testid="go_to_private_chat"
					/>
				</Row>
			)}
		</CustomContainer>
	);
};

export default ParticipantElement;
