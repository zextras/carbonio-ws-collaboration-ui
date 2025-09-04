/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import {
	Avatar,
	Container,
	Row,
	Shimmer,
	Text,
	Button,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useAvatarUtilities from '../../../../hooks/useAvatarUtilities';
import { MeetingsApi } from '../../../../network';
import { getUserHandRank } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getRoomIdByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import { getOwnershipOfTheRoom } from '../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import { getIsUserGuest, getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import GuestUserLabel from '../../GuestUserLabel';

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomAvatar = styled(Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

type RaiseHandUserProps = {
	meetingId: string;
	userId: string;
};

const RaiseHandUser: FC<RaiseHandUserProps> = ({ meetingId, userId }) => {
	const [t] = useTranslation();

	const lowerMyHandTooltip = t('meeting.interactions.handDown', 'Lower your hand');

	const memberName: string = useStore((store) => getUserName(store, userId));
	const lowerUserHandTooltip = t(
		'meeting.sidebar.tooltip.lowerUserHand',
		`Lower ${memberName}'s hand`,
		{
			memberName
		}
	);

	const isGuest = useStore((store) => getIsUserGuest(store, userId));
	const userHandRank = useStore((store) => getUserHandRank(store, userId ?? ''));
	const myUserId = useStore(getUserId);
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId ?? ''));
	const { avatarPicture, avatarIcon, avatarColor, isLoading } = useAvatarUtilities(userId);

	const canLowerHand = useMemo(
		() => amIModerator || userId === myUserId,
		[amIModerator, myUserId, userId]
	);

	const lowerHand = useCallback(() => {
		MeetingsApi.raiseHand(meetingId, false, userId);
	}, [meetingId, userId]);

	const tooltipSelector = useMemo(() => {
		if (userId === myUserId) {
			return lowerMyHandTooltip;
		}
		if (amIModerator) {
			return lowerUserHandTooltip;
		}
		return '';
	}, [amIModerator, lowerMyHandTooltip, lowerUserHandTooltip, myUserId, userId]);

	const avatar = useMemo(
		() =>
			isLoading ? (
				<Shimmer.Avatar />
			) : (
				<CustomAvatar
					label={memberName}
					shape="round"
					icon={avatarIcon}
					background={avatarColor}
					picture={avatarPicture}
				/>
			),
		[avatarColor, avatarIcon, avatarPicture, isLoading, memberName]
	);

	return (
		<CustomContainer data-testid="waitingUser" orientation="horizontal" width="fill">
			{avatar}
			<Row takeAvailableSpace wrap="nowrap" height="100%">
				<Container crossAlignment="flex-start" padding={{ horizontal: 'small' }}>
					<Container orientation={'horizontal'} mainAlignment="flex-start" gap={'0.25rem'}>
						<Text size="small" overflow="ellipsis">
							{memberName}
						</Text>
						{isGuest && <GuestUserLabel />}
					</Container>
				</Container>
			</Row>
			<Row orientation="horizontal" width="fit" gap="0.5rem">
				<Tooltip label={tooltipSelector} disabled={!canLowerHand} placement="top">
					<Button
						iconPlacement="left"
						icon="Hand"
						backgroundColor={'gray0'}
						label={`${userHandRank}`}
						disabled={!canLowerHand}
						onClick={lowerHand}
					/>
				</Tooltip>
			</Row>
		</CustomContainer>
	);
};

export default RaiseHandUser;
