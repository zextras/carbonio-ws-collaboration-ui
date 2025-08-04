/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container, Icon, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import usePinnedTile from '../../../hooks/usePinnedTile';
import { getUserHandRank } from '../../../store/selectors/ActiveMeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import { getIsUserGuest, getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { Z_INDEX_RANK } from '../../../types/generics';
import GuestUserLabel from '../GuestUserLabel';

const InfoContainer = styled(Container)`
	height: 100%;
	aspect-ratio: 16/9;
	position: absolute;
	z-index: ${Z_INDEX_RANK.TILE_INFO};
`;

const TextContainer = styled(Row)`
	max-width: 90%;
	background-color: ${({ theme }): string => theme.palette.text.regular};
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	user-select: none;
`;

const CustomContainer = styled(Row)`
	border-radius: 0.25rem;
`;

type tileUserInfoProps = {
	meetingId: string | undefined;
	userId: string | undefined;
	videoStreamEnabled: boolean;
	audioStreamEnabled: boolean;
	isScreenShare: boolean | undefined;
	isHandRaised: boolean;
};

const TileUserInfo: FC<tileUserInfoProps> = ({
	meetingId,
	userId,
	videoStreamEnabled,
	audioStreamEnabled,
	isScreenShare,
	isHandRaised
}) => {
	const [t] = useTranslation();
	const micOffLabel = t('meetings.interactions.yourMicIsDisabled', 'Your microphone is off');
	const camOffLabel = t('meetings.interactions.yourCamIsDisabled', 'Your camera is off');

	const userName = useStore((store) => getUserName(store, userId ?? ''));
	const isSessionTile = useStore(getUserId) === userId;
	const isUserGuest = useStore((store) => getIsUserGuest(store, userId ?? ''));
	const userHandRank = useStore((store) => getUserHandRank(store, userId ?? ''));

	const { canUsePinFeature, isPinned } = usePinnedTile(
		meetingId ?? '',
		userId ?? '',
		isScreenShare
	);

	const mediaStatusIcons = useMemo(
		() => (
			<>
				{!videoStreamEnabled && (
					<Tooltip label={camOffLabel} disabled={!isSessionTile}>
						<CustomContainer background="gray0" height="fit" width="fit" padding="0.5rem">
							<Icon icon="VideoOffOutline" color="gray6" size="medium" />
						</CustomContainer>
					</Tooltip>
				)}
				{!audioStreamEnabled && (
					<Tooltip label={micOffLabel} disabled={!isSessionTile}>
						<CustomContainer background="gray0" height="fit" width="fit" padding="0.5rem">
							<Icon icon="MicOffOutline" color="gray6" size="medium" />
						</CustomContainer>
					</Tooltip>
				)}
				{canUsePinFeature && isPinned && (
					<CustomContainer background="gray0" height="fit" width="fit" padding="0.5rem">
						<Icon icon="Pin3Outline" color="gray6" size="medium" />
					</CustomContainer>
				)}
				{isScreenShare && (
					<CustomContainer background="gray0" height="fit" width="fit" padding="0.5rem">
						<Icon icon="ScreenSharingOnOutline" color="gray6" size="medium" />
					</CustomContainer>
				)}
			</>
		),
		[
			audioStreamEnabled,
			camOffLabel,
			canUsePinFeature,
			isPinned,
			isScreenShare,
			isSessionTile,
			micOffLabel,
			videoStreamEnabled
		]
	);

	return (
		<InfoContainer orientation="vertical" mainAlignment="space-between" maxWidth="100%">
			<Row
				orientation="horizontal"
				mainAlignment={'flex-start'}
				crossAlignment={'flex-start'}
				height="fit"
				width="fill"
				padding="0.5rem"
				style={{ gap: '0.5rem' }}
			>
				{mediaStatusIcons}
			</Row>
			<Row
				mainAlignment={'flex-end'}
				crossAlignment={'flex-end'}
				height="fit"
				width="fill"
				padding="0.5rem"
				gap="0.5rem"
				wrap="nowrap"
			>
				<Row takeAvailableSpace mainAlignment={'flex-end'} crossAlignment={'flex-end'}>
					<TextContainer orientation={'horizontal'} width={'fit'} height={'fit'} gap={'0.25rem'}>
						<Text color={'gray6'}>{userName}</Text>
						{isUserGuest && <GuestUserLabel />}
					</TextContainer>
				</Row>
				{isHandRaised && !isScreenShare && (
					<CustomContainer
						background={'gray0'}
						height="fit"
						width="fit"
						padding="0.35rem"
						gap="0.25rem"
					>
						<Icon icon="Hand" color="warning" />
						<Text color={'gray6'}>{userHandRank}</Text>
					</CustomContainer>
				)}
			</Row>
		</InfoContainer>
	);
};

export default TileUserInfo;
