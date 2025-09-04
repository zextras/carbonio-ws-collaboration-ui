/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import { Avatar, Container, Row, Shimmer, Text } from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';

import useAvatarUtilities from '../../../../../hooks/useAvatarUtilities';
import { useOwners } from '../../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../../../store/selectors/UsersSelectors';
import useStore from '../../../../../store/Store';
import UserPopoverList from '../../../userPopoverList/UserPopoverList';

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

const ClickableText = styled(Text)<{ $displayList: boolean }>`
	cursor: ${({ $displayList }): string | undefined | false =>
		$displayList ? 'pointer' : 'default;'};
`;

const InfoSection: FC<InfoSectionProps> = ({
	roomId,
	userIsModerator,
	amIParticipating,
	isMyRoom
}) => {
	const [t] = useTranslation();

	const youLabel = t('status.you', 'You');
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
	const virtualRoomModeratorsLabel = t(
		'meeting.virtual.moderators.widget',
		"Virtual Room's moderators:"
	);

	const sessionId = useStore(getUserId);
	const sessionName = useStore((store) => getUserName(store, sessionId ?? ''));
	const moderatorsList = useOwners(roomId);
	const moderatorName = useStore((store) => getUserName(store, moderatorsList[0]));

	const moderatorsTextRef = useRef(null);

	const otherModeratorsLabel = useMemo(
		() => (
			<Trans
				i18nKey="meeting.virtual.moderators.multipleAdditional"
				defaults="and other <strong>{{numberOfModerators}} moderators</strong>."
				values={{ numberOfModerators: moderatorsList.length - 1 }}
			/>
		),
		[moderatorsList.length]
	);

	const { avatarPicture, avatarColor, isLoading } = useAvatarUtilities(
		userIsModerator ? (sessionId ?? '') : moderatorsList[0]
	);

	const ownerName = useMemo(
		() => (userIsModerator ? youLabel : moderatorName),
		[userIsModerator, youLabel, moderatorName]
	);

	const moderatorLabel = useMemo(() => {
		if (size(moderatorsList) > 2) return otherModeratorsLabel;
		if (size(moderatorsList) === 2) return otherOneModeratorLabel;
		if (userIsModerator) return sessionOnlyModeratorLabel;
		return isTheOnlyModeratorLabel;
	}, [
		moderatorsList,
		otherModeratorsLabel,
		otherOneModeratorLabel,
		userIsModerator,
		sessionOnlyModeratorLabel,
		isTheOnlyModeratorLabel
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
				<Container ref={moderatorsTextRef} crossAlignment="flex-start" width="fit">
					<ClickableText
						size="extrasmall"
						weight="light"
						color="gray1"
						ref={moderatorsTextRef}
						$displayList={size(moderatorsList) > 1}
					>
						{moderatorLabel}
					</ClickableText>
					{size(moderatorsList) > 1 && (
						<UserPopoverList
							anchorEl={moderatorsTextRef}
							userList={moderatorsList}
							title={virtualRoomModeratorsLabel}
							icon="Crown"
							placement="right"
						/>
					)}
				</Container>
			</Row>
		</CustomRow>
	);
};

export default InfoSection;
