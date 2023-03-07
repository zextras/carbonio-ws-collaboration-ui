/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Avatar, Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';
import React, { FC, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getUserName, getUserSelector } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { DeletedMessage, MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { getPreviewURL } from '../../../utils/attachmentUtils';
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

const CustomAvatar = styled(Avatar)`
	svg {
		width: calc(2rem * 0.75);
		min-width: calc(2rem * 0.75);
		height: calc(2rem * 0.75);
		min-height: calc(2rem * 0.75);
	}
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

	const previewURL = useMemo(() => {
		if (repliedMessage.type === MessageType.TEXT_MSG && repliedMessage.attachment) {
			return getPreviewURL(repliedMessage.attachment.id, repliedMessage.attachment.mimeType);
		}
		return undefined;
	}, [repliedMessage]);

	const textToShow = useMemo(() => {
		if (repliedMessage.type === MessageType.TEXT_MSG) {
			if (repliedMessage.attachment) {
				return repliedMessage.text !== '' ? repliedMessage.text : repliedMessage.attachment.name;
			}
			return repliedMessage.forwarded ? repliedMessage.forwarded.text : repliedMessage.text;
		}
		return '';
	}, [repliedMessage]);

	return (
		<>
			<RepliedTextMessageContainer
				data-testid={`repliedView-${repliedMessage.id}`}
				background={isMyMessage ? '#C4D5EF' : 'gray5'}
				padding={{ horizontal: 'small', vertical: 'small' }}
				orientation="horizontal"
				userBorderColor={userColor}
				onClick={scrollTo}
			>
				{repliedMessage.type === MessageType.TEXT_MSG && repliedMessage.attachment && (
					<Padding right="small">
						<CustomAvatar
							size="large"
							icon="FileTextOutline"
							label={repliedMessage.attachment.name}
							shape="square"
							background={previewURL ? 'gray3' : 'gray0'}
							picture={previewURL}
						/>
					</Padding>
				)}
				<Container crossAlignment="flex-start">
					{senderIdentifier && <BubbleHeader senderId={repliedMessage.from} />}
					{repliedMessage && repliedMessage.type === MessageType.TEXT_MSG && (
						<MessageWrap color="secondary" overflow="ellipsis" size="medium">
							{textToShow}
						</MessageWrap>
					)}
					{repliedMessage && repliedMessage.type === MessageType.DELETED_MSG && (
						<DeletedMessageWrap color="secondary" overflow="ellipsis" size="medium">
							{deletedMessageLabel}
						</DeletedMessageWrap>
					)}
					{repliedMessage && repliedMessage.type !== MessageType.DELETED_MSG && (
						<BubbleFooter date={repliedMessage.date} isEdited={repliedMessage.edited} />
					)}
				</Container>
			</RepliedTextMessageContainer>
			<Padding top="small" />
		</>
	);
};

export default RepliedTextMessageSectionView;
