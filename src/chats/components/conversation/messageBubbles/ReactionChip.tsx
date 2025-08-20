/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useState, useEffect, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Avatar, Container, Padding, Tooltip } from '@zextras/carbonio-design-system';
import { includes, size } from 'lodash';

import useAvatarUtilities from '../../../../hooks/useAvatarUtilities';
import { getIsNewReaction } from '../../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../../store/selectors/ConnectionSelector';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import { useUserNameList } from '../../../../store/selectors/usersSelectors/useUserNameList';
import useStore from '../../../../store/Store';

const CustomContainer = styled(Container)<{ $animation: boolean }>`
	border-radius: 1.25rem;
	font-size: 0.9rem;
	cursor: pointer;
	animation: bounceIn 0.4s ease-in-out;
	transition: background-color 1s ease;

	@keyframes bounceIn {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		60% {
			transform: scale(1.1);
			opacity: 1;
		}
		100% {
			transform: scale(1);
		}
	}

	${({ $animation }): string =>
		$animation ? `animation: bounceIn 0.4s ease-in-out;` : `animation: none;`}
`;

const CustomAvatar = styled(Avatar)<{ $numberBadge: boolean }>`
	> p {
		font-size: 0.5rem;
		${({ $numberBadge, theme }): string | false =>
			$numberBadge && `font-size: 0.75rem; color: ${theme.palette.text.regular};`}
	}
`;

type ReactionChipProps = {
	reaction: string;
	from: string[];
	roomId: string;
	stanzaId: string;
};

const ReactionChip = ({ reaction, from, roomId, stanzaId }: ReactionChipProps): ReactElement => {
	const xmppClient = useStore(getXmppClient);
	const sessionId = useStore(getUserId);
	const isNewReaction = useStore((store) => getIsNewReaction(store, roomId, stanzaId, reaction));
	const userNameList = useUserNameList(from);

	const [isAnimating, setIsAnimating] = useState(false);
	const [backgroundEffect, setBackgroundEffect] = useState(isNewReaction);

	useEffect(() => {
		if (isNewReaction) {
			setBackgroundEffect(true);
		} else {
			setTimeout(() => {
				setBackgroundEffect(false);
			}, 5000);
		}
	}, [isNewReaction]);

	const { avatarColor, avatarPicture, avatarIcon } = useAvatarUtilities(from[0]);

	const tooltipLabel = useMemo(() => userNameList.join(', '), [userNameList]);

	const pictureToShow = useMemo(
		() => (size(from) === 1 ? avatarPicture : undefined),
		[from, avatarPicture]
	);

	const avatarLabel = useMemo(
		() => (size(from) === 1 ? userNameList[0] : size(from).toString()),
		[userNameList, from]
	);

	const colorToShow = useMemo(
		() => (size(from) === 1 ? avatarColor : 'gray4'),
		[from, avatarColor]
	);

	const changeReaction = useCallback(() => {
		setIsAnimating(true);
		if (includes(from, sessionId)) {
			xmppClient.sendChatMessageReaction(roomId, stanzaId, '');
		} else {
			xmppClient.sendChatMessageReaction(roomId, stanzaId, reaction);
		}
		setTimeout(() => setIsAnimating(false), 500);
	}, [from, reaction, roomId, sessionId, stanzaId, xmppClient]);

	return (
		<Tooltip label={tooltipLabel}>
			<CustomContainer
				background={backgroundEffect ? 'primary' : 'gray4'}
				width="fit-content"
				minHeight="1.5rem"
				maxHeight="1.5rem"
				padding="0.25rem 0.25rem 0.25rem 0.3rem"
				orientation="horizontal"
				gap="0.25rem"
				onClick={changeReaction}
				data-testid="reaction-chip"
				$animation={isAnimating}
			>
				<Padding bottom="0.1rem">{reaction}</Padding>
				<CustomAvatar
					size="small"
					label={avatarLabel}
					shape="round"
					picture={pictureToShow}
					icon={avatarIcon}
					background={colorToShow}
					$numberBadge={size(from) > 1}
				/>
			</CustomContainer>
		</Tooltip>
	);
};

export default ReactionChip;
