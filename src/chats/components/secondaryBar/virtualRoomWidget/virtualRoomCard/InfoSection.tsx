/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { Avatar, Row, Shimmer, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useAvatarUtilities from '../../../../../hooks/useAvatarUtilities';
import { getOwners } from '../../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../../../store/selectors/UsersSelectors';
import useStore from '../../../../../store/Store';

type InfoSectionProps = {
	roomId: string;
	userIsModerator: boolean;
	amIParticipating: boolean;
	isMyRoom: boolean | undefined;
};

const CustomAvatar = styled(Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

const CustomShimmerAvatar = styled(Shimmer.Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

const CustomRow = styled(Row)<{ $isMyRoom: boolean | undefined }>`
	${({ $isMyRoom }): string | undefined | false => !$isMyRoom && 'opacity: 0.5; cursor: default;'};
`;

const InfoSection: FC<InfoSectionProps> = ({
	roomId,
	userIsModerator,
	amIParticipating,
	isMyRoom
}) => {
	const [t] = useTranslation();

	const sessionOnlyModeratorLabel = t(
		'meeting.virtual.moderators.onlyUser',
		"You're the only moderator"
	);
	const isTheOnlyModeratorLabel = t(
		'meeting.virtual.moderators.onlyModerator',
		'is the only moderator'
	);
	const otherOneModeratorLabel = t(
		'meeting.virtual.moderators.singleAdditional',
		'and other one moderator'
	);

	const sessionId = useStore(getUserId);
	const sessionName = useStore((store) => getUserName(store, sessionId ?? ''));
	const moderatorsList = useStore((store) => getOwners(store, roomId));
	const moderatorName = useStore((store) => getUserName(store, moderatorsList[0].userId));

	const otherModeratorsLabel = t(
		'meeting.virtual.moderators.multipleAdditional',
		'and other {{numberOfModerators}} moderators',
		{
			numberOfModerators: moderatorsList.length - 1
		}
	);

	const { avatarPicture, avatarColor, isLoading } = useAvatarUtilities(
		userIsModerator ? (sessionId ?? '') : moderatorsList[0].userId
	);

	const ownerName = useMemo(
		() => (userIsModerator ? 'You' : moderatorName),
		[userIsModerator, moderatorName]
	);

	const moderatorLabel = useMemo(() => {
		if (moderatorsList.length === 1) {
			return userIsModerator ? sessionOnlyModeratorLabel : isTheOnlyModeratorLabel;
		}

		if (moderatorsList.length === 2) {
			return otherOneModeratorLabel;
		}

		return otherModeratorsLabel;
	}, [
		moderatorsList.length,
		otherModeratorsLabel,
		userIsModerator,
		isTheOnlyModeratorLabel,
		sessionOnlyModeratorLabel,
		otherOneModeratorLabel
	]);

	return (
		<CustomRow
			takeAvailableSpace
			orientation="horizontal"
			gap="0.5rem"
			mainAlignment="flex-start"
			$isMyRoom={amIParticipating || isMyRoom}
		>
			<Row>
				{isLoading ? (
					<CustomShimmerAvatar />
				) : (
					<CustomAvatar
						label={userIsModerator ? sessionName : moderatorName}
						shape="round"
						picture={avatarPicture}
						background={avatarColor}
					/>
				)}
			</Row>
			<Row orientation="vertical" takeAvailableSpace height="fit" crossAlignment="flex-start">
				<Text size="small" overflow="ellipsis">
					{ownerName}
				</Text>
				<Text size="extrasmall" weight="light" color="gray1">
					{moderatorLabel}
				</Text>
			</Row>
		</CustomRow>
	);
};

export default InfoSection;
