/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { Button, Container, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import usePinnedTile from '../../../hooks/usePinnedTile';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import { getIsUserGuest, getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import GuestUserLabel from '../GuestUserLabel';

const InfoContainer = styled(Container)`
	height: auto;
	aspect-ratio: 16/9;
	position: absolute;
`;

const TextContainer = styled(Container)`
	position: absolute;
	max-width: 90%;
	background-color: ${({ theme }): string => theme.palette.text.regular};
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	z-index: 2;
	user-select: none;
`;

const CustomButton = styled(Button)`
	cursor: default;
	z-index: 1;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray0.regular} !important;
		color: ${({ theme }): string => theme.palette.gray6.regular} !important;
	}
`;

type tileUserInfoProps = {
	meetingId: string | undefined;
	userId: string | undefined;
	videoStreamEnabled: boolean;
	audioStreamEnabled: boolean;
	isScreenShare: boolean | undefined;
};

const TileUserInfo: FC<tileUserInfoProps> = ({
	meetingId,
	userId,
	videoStreamEnabled,
	audioStreamEnabled,
	isScreenShare
}) => {
	const [t] = useTranslation();
	const micOffLabel = t('meetings.interactions.yourMicIsDisabled', 'Your microphone is off');
	const camOffLabel = t('meetings.interactions.yourCamIsDisabled', 'Your camera is off');

	const userName = useStore((store) => getUserName(store, userId ?? ''));
	const isSessionTile = useStore(getUserId) === userId;
	const isUserGuest = useStore((store) => getIsUserGuest(store, userId ?? ''));

	const { canUsePinFeature, isPinned } = usePinnedTile(
		meetingId ?? '',
		userId ?? '',
		isScreenShare
	);

	const placeHolderFn = (): null => null;

	const mediaStatusIcons = useMemo(
		() => (
			<>
				{!videoStreamEnabled && (
					<Tooltip label={camOffLabel} disabled={!isSessionTile}>
						<CustomButton
							icon="VideoOffOutline"
							labelColor="gray6"
							backgroundColor="gray0"
							size="large"
							onClick={placeHolderFn}
						/>
					</Tooltip>
				)}
				{!audioStreamEnabled && (
					<Tooltip label={micOffLabel} disabled={!isSessionTile}>
						<CustomButton
							icon="MicOffOutline"
							labelColor="gray6"
							backgroundColor="gray0"
							size="large"
							onClick={placeHolderFn}
						/>
					</Tooltip>
				)}
				{canUsePinFeature && isPinned && (
					<CustomButton
						icon="Pin3Outline"
						labelColor="gray6"
						backgroundColor="gray0"
						size="large"
						onClick={placeHolderFn}
					/>
				)}
				{isScreenShare && (
					<CustomButton
						icon="ScreenSharingOnOutline"
						color="gray6"
						backgroundColor="gray0"
						size="large"
						onClick={placeHolderFn}
					/>
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
		<InfoContainer orientation="horizontal">
			<Row
				orientation="horizontal"
				mainAlignment={'flex-start'}
				crossAlignment={'flex-start'}
				height="fill"
				padding="0.5rem"
				style={{ gap: '0.5rem' }}
			>
				{mediaStatusIcons}
			</Row>
			<Row
				mainAlignment={'flex-end'}
				crossAlignment={'flex-end'}
				height="fill"
				takeAvailableSpace
				padding="0.5rem"
			>
				<TextContainer orientation={'horizontal'} width={'fit'} height={'fit'} gap={'0.25rem'}>
					<Text color={'gray6'}>{userName}</Text>
					{isUserGuest && <GuestUserLabel />}
				</TextContainer>
			</Row>
		</InfoContainer>
	);
};

export default TileUserInfo;
