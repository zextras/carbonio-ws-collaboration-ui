/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';
import React, { FC, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getUserName, getUserSelector } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { DeletedMessage, MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { calculateAvatarColor } from '../../../utils/styleUtils';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';

type RepliedTextMessageSectionViewProps = {
	repliedMessage: TextMessage | DeletedMessage;
	isMyMessage: boolean;
};

const RepliedTextMessageContainer = styled(Container)`
	border-left: ${({ userBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[userBorderColor]}`};
	border-radius: 0 0.25rem 0.25rem 0;
	cursor: pointer;
`;

const MessageWrap = styled(Text)`
	height: inherit;
`;

const DeletedMessageWrap = styled(Text)`
	height: inherit;
	font-style: italic;
	padding-right: 0.1875rem;
`;

const RepliedTextMessageSectionView: FC<RepliedTextMessageSectionViewProps> = ({
	repliedMessage,
	isMyMessage
}) => {
	const [t] = useTranslation();
	const deletedMessageLabel = t('message.deletedMessage', 'Deleted message');

	const sessionId: string | undefined = useStore((state) => state.session.id);
	const replyUserInfo = useStore((store) => getUserSelector(store, repliedMessage?.from));
	const senderIdentifier = useStore((store) => getUserName(store, repliedMessage?.from));
	const userColor = useMemo(() => calculateAvatarColor(senderIdentifier || ''), [senderIdentifier]);

	const settings = useUserSettings();

	const darkModeSettings = useMemo(
		() => find(settings.props, (value) => value.name === 'zappDarkreaderMode')?._content,
		[settings.props]
	);

	const isInViewport = (element: HTMLElement): boolean => {
		const rect = element.getBoundingClientRect();
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			rect.right <= (window.innerWidth || document.documentElement.clientWidth)
		);
	};

	const scrollTo = useCallback(() => {
		const messageScrollTo = window.parent.document.getElementById(`message-${repliedMessage.id}`);
		if (messageScrollTo && replyUserInfo) {
			if (!isInViewport(messageScrollTo)) messageScrollTo.scrollIntoView({ block: 'center' });
			const childNode = messageScrollTo.childNodes[0] as HTMLElement;
			switch (darkModeSettings) {
				case 'enabled': {
					childNode.style.animation = `${
						sessionId && sessionId !== replyUserInfo.id
							? 'highlightothersmessagebubbledark'
							: 'highlightmymessagebubbledark'
					} 1.2s 0.2s ease-in-out`;
					messageScrollTo.style.animation = `${
						sessionId && sessionId !== replyUserInfo.id
							? 'highlightothersmessagebubbledark'
							: 'highlightmymessagebubbledark'
					} 1.2s 0.2s ease-in-out`;
					break;
				}
				case 'disabled': {
					childNode.style.animation = `${
						sessionId && sessionId !== replyUserInfo.id
							? 'highlightothersmessagebubblelight'
							: 'highlightmymessagebubblelight'
					} 1.2s 0.2s ease-in-out`;
					messageScrollTo.style.animation = `${
						sessionId && sessionId !== replyUserInfo.id
							? 'highlightothersmessagebubblelight'
							: 'highlightmymessagebubblelight'
					} 1.2s 0.2s ease-in-out`;
					break;
				}
				case 'auto': {
					childNode.style.animation = `${
						sessionId && sessionId !== replyUserInfo.id
							? 'highlightothersmessagebubble'
							: 'highlightmymessagebubble'
					} 1.2s 0.2s ease-in-out`;
					messageScrollTo.style.animation = `${
						sessionId && sessionId !== replyUserInfo.id
							? 'highlightothersmessagebubble'
							: 'highlightmymessagebubble'
					} 1.2s 0.2s ease-in-out`;
					break;
				}
				default:
					break;
			}
			setTimeout(() => {
				messageScrollTo.style.animation = '';
				(messageScrollTo.firstChild as HTMLElement).style.animation = '';
			}, 1400);
		}
	}, [repliedMessage.id, replyUserInfo, darkModeSettings, sessionId]);

	return (
		<>
			<RepliedTextMessageContainer
				data-testid={`repliedView-${repliedMessage.id}`}
				background={isMyMessage ? '#C4D5EF' : 'gray5'}
				padding={{ horizontal: 'small', vertical: 'small' }}
				crossAlignment="flex-start"
				userBorderColor={userColor}
				onClick={scrollTo}
			>
				{senderIdentifier && <BubbleHeader senderId={repliedMessage.from} />}
				{repliedMessage && repliedMessage.type === MessageType.TEXT_MSG && (
					<MessageWrap color="secondary" overflow="ellipsis" size="small">
						{!repliedMessage.forwarded ? repliedMessage.text : repliedMessage.forwarded.text}
					</MessageWrap>
				)}
				{repliedMessage && repliedMessage.type === MessageType.DELETED_MSG && (
					<DeletedMessageWrap color="secondary" overflow="ellipsis" size="small">
						{deletedMessageLabel}
					</DeletedMessageWrap>
				)}
				{repliedMessage && repliedMessage.type !== MessageType.DELETED_MSG && (
					<BubbleFooter date={repliedMessage.date} isEdited={repliedMessage.edited} />
				)}
			</RepliedTextMessageContainer>
			<Padding top="small" />
		</>
	);
};

export default RepliedTextMessageSectionView;
