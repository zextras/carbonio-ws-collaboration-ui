/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import {
	Avatar,
	Container,
	IconButton,
	Row,
	Shimmer,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { MeetingsApi, UsersApi } from '../../../../network';
import {
	getIsUserGuest,
	getUserName,
	getUserPictureUpdatedAt
} from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import GuestUserLabel from '../../GuestUserLabel';

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomAvatar = styled(Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

type WaitingUserProps = {
	meetingId: string;
	userId: string;
};

const WaitingUser: FC<WaitingUserProps> = ({ meetingId, userId }) => {
	const [t] = useTranslation();
	const waitingToEnterLabel = t('meeting.sidebar.waitingCaption', 'Waiting to enter');
	const acceptButtonTooltip = t('meeting.sidebar.tooltip.waitingAccept', 'Let user in');
	const rejectButtonTooltip = t('meeting.sidebar.tooltip.waitingReject', 'Reject user');

	const memberName: string | undefined = useStore((store) => getUserName(store, userId));
	const isUserGuest = useStore((store) => getIsUserGuest(store, userId));
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, userId)
	);

	const picture = useMemo(
		() =>
			userPictureUpdatedAt ? `${UsersApi.getURLUserPicture(userId)}?${userPictureUpdatedAt}` : '',
		[userId, userPictureUpdatedAt]
	);

	const avatarElement = useMemo(
		() =>
			memberName ? (
				<CustomAvatar
					label={memberName}
					shape="round"
					picture={picture}
					icon={isUserGuest ? 'SmileOutline' : ''}
				/>
			) : (
				<Container width="fit" height="fit">
					<Shimmer.Avatar width="2rem" data-testid="avatarShimmer" />
				</Container>
			),
		[isUserGuest, memberName, picture]
	);

	const acceptWaitingUser = useCallback(
		() => MeetingsApi.acceptWaitingUser(meetingId, userId, true),
		[meetingId, userId]
	);

	const rejectWaitingUser = useCallback(
		() => MeetingsApi.acceptWaitingUser(meetingId, userId, false),
		[meetingId, userId]
	);

	return (
		<CustomContainer data-testid="waitingUser" orientation="horizontal" width="fill">
			{avatarElement}
			<Row takeAvailableSpace wrap="nowrap" height="100%">
				<Container crossAlignment="flex-start" padding={{ horizontal: 'small' }}>
					<Container orientation={'horizontal'} mainAlignment="flex-start" gap={'0.25rem'}>
						<Text size="small" overflow="ellipsis">
							{memberName}
						</Text>
						{isUserGuest && <GuestUserLabel />}
					</Container>
					<Text size="extrasmall" overflow="ellipsis">
						{waitingToEnterLabel}
					</Text>
				</Container>
			</Row>
			<Container orientation="horizontal" width="fit" gap="0.5rem">
				<Tooltip label={acceptButtonTooltip} placement="top">
					<IconButton
						icon="CheckmarkOutline"
						size="large"
						backgroundColor="success"
						iconColor="gray6"
						onClick={acceptWaitingUser}
					/>
				</Tooltip>
				<Tooltip label={rejectButtonTooltip} placement="top">
					<IconButton
						icon="CloseOutline"
						size="large"
						backgroundColor="error"
						iconColor="gray6"
						onClick={rejectWaitingUser}
					/>
				</Tooltip>
			</Container>
		</CustomContainer>
	);
};

export default WaitingUser;
