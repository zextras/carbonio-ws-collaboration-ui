/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { Avatar, Container, Row, Shimmer, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components';

import useAvatarUtilities from '../../../../../hooks/useAvatarUtilities';
import { getOwners } from '../../../../../store/selectors/RoomsSelectors';
import { getUserName } from '../../../../../store/selectors/UsersSelectors';
import useStore from '../../../../../store/Store';

type InfoSectionProps = {
	roomId: string;
	userIsModerator: boolean;
	sessionId: string | undefined;
	amIParticipating: boolean;
	isMyRoom: boolean | undefined;
};

const CustomAvatar = styled(Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

const CustomRow = styled(Row)<{ isMyRoom: boolean | undefined }>`
	${({
		isMyRoom
	}: {
		isMyRoom: boolean | undefined;
		theme: DefaultTheme;
	}): string | undefined | false => !isMyRoom && 'opacity: 0.5; cursor: default;'};
`;

const InfoSection: FC<InfoSectionProps> = ({
	roomId,
	userIsModerator,
	sessionId,
	amIParticipating,
	isMyRoom
}) => {
	const [t] = useTranslation();

	const sessionOnlyModeratorLabel = t('', "You're the only moderator");
	const isTheOnlyModeratorLabel = t('', 'is the only moderator');
	const otherOneModeratorLabel = t('', 'and other one moderator');

	const sessionName = useStore((store) => getUserName(store, sessionId ?? ''));
	const moderatorsList = useStore((store) => getOwners(store, roomId));
	const moderatorName = useStore((store) => getUserName(store, moderatorsList[0].userId));

	const otherModeratorsLabel = t('', 'and other {{numberOfModerators}} moderators', {
		numberOfModerators: moderatorsList.length - 1
	});

	const { avatarColor, isLoading } = useAvatarUtilities(
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
			isMyRoom={amIParticipating || isMyRoom}
		>
			{isLoading ? (
				<Shimmer.Avatar />
			) : (
				<CustomAvatar
					label={userIsModerator ? sessionName : moderatorName}
					shape="round"
					background={avatarColor}
				/>
			)}
			<Container height="fit" width="fit" crossAlignment="flex-start">
				<Text size="small" overflow="ellipsis">
					{ownerName}
				</Text>
				<Text size="extrasmall" weight="light" color="gray1">
					{moderatorLabel}
				</Text>
			</Container>
		</CustomRow>
	);
};

export default InfoSection;
