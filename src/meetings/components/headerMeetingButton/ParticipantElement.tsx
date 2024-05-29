/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Avatar, Container, Text, Shimmer, Row } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import GoToPrivateChatAction from '../../../chats/components/infoPanel/conversationParticipantsAccordion/GoToPrivateChatAction';
import { UsersApi } from '../../../network';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import {
	getIsUserExternal,
	getUserName,
	getUserPictureUpdatedAt
} from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import ExternalUserLabel from '../ExternalUserLabel';
import MeetingParticipantActions from '../sidebar/ParticipantsAccordion/MeetingParticipantActions';

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomAvatar = styled(Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

type ParticipantElementProps = {
	memberId: string;
	meetingId?: string;
	isInsideMeeting?: boolean;
};

const ParticipantElement: FC<ParticipantElementProps> = ({
	memberId,
	isInsideMeeting,
	meetingId
}) => {
	const userId: string | undefined = useStore((store) => getUserId(store));
	const memberName: string | undefined = useStore((store) => getUserName(store, memberId));
	const isUserExternal = useStore((store) => getIsUserExternal(store, memberId));
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, memberId)
	);

	const picture = useMemo(() => {
		if (userPictureUpdatedAt != null) {
			return `${UsersApi.getURLUserPicture(memberId)}?${userPictureUpdatedAt}`;
		}
		return '';
	}, [memberId, userPictureUpdatedAt]);

	const avatarElement = useMemo(
		() =>
			memberName == null ? (
				<Container width="fit" height="fit">
					<Shimmer.Avatar width="2rem" />
				</Container>
			) : (
				<CustomAvatar
					label={memberName}
					shape="round"
					picture={picture}
					icon={isUserExternal ? 'SmileOutline' : ''}
				/>
			),
		[memberName, picture, isUserExternal]
	);

	const infoElement = useMemo(
		() => (
			<Row takeAvailableSpace wrap="nowrap" height="100%">
				<Container
					orientation="horizontal"
					mainAlignment="flex-start"
					padding={{ horizontal: 'small' }}
					gap={'0.25rem'}
				>
					<Text color="text" size="small" overflow="ellipsis">
						{memberName}
					</Text>
					{isUserExternal && <ExternalUserLabel />}
				</Container>
			</Row>
		),
		[isUserExternal, memberName]
	);

	const isSessionParticipant: boolean = useMemo(() => memberId === userId, [memberId, userId]);

	return (
		<CustomContainer
			data-testid="participant_element"
			orientation="horizontal"
			width="fill"
			padding={{ top: 'extrasmall', bottom: 'extrasmall' }}
		>
			{avatarElement}
			{infoElement}
			{!isInsideMeeting ? (
				!isSessionParticipant && (
					<Row>
						<GoToPrivateChatAction
							memberId={memberId}
							isParticipantMeeting
							data-testid="go_to_private_chat"
						/>
					</Row>
				)
			) : (
				<MeetingParticipantActions memberId={memberId} meetingId={meetingId} />
			)}
		</CustomContainer>
	);
};

export default ParticipantElement;
