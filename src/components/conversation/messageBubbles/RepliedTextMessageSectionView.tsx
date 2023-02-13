/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';
import moment from 'moment-timezone';
import React, { FC, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';

import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import { getFistMessageOfHistory } from '../../../store/selectors/MessagesSelectors';
import { getPrefTimezoneSelector } from '../../../store/selectors/SessionSelectors';
import { getUserSelector } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/MessageTypes';
import { calculateAvatarColor } from '../../../utils/styleUtils';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';

type RepliedTextMessageSectionViewProps = {
	repliedMessage: TextMessage;
	roomId: string;
	isMyMessage: boolean;
};

const ReplayedTextMessageContainer = styled(Container)`
	border-left: ${({ userBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[userBorderColor]}`};
	border-radius: 0 0.25rem 0.25rem 0;
	cursor: pointer;
`;

const MessageWrap = styled(Text)`
	height: inherit;
`;

const RepliedTextMessageSectionView: FC<RepliedTextMessageSectionViewProps> = ({
	repliedMessage,
	roomId,
	isMyMessage
}) => {
	const xmppClient = useStore(getXmppClient);
	const sessionId: string | undefined = useStore((state) => state.session.id);
	const firstMessage = useStore((state) => getFistMessageOfHistory(state, roomId));
	const replyUserInfo = useStore((store) =>
		getUserSelector(store, repliedMessage ? repliedMessage.from : undefined)
	);
	const timezone = useStore(getPrefTimezoneSelector);

	const messageTime = repliedMessage?.date
		? moment.tz(repliedMessage.date, timezone).format('HH:MM')
		: null;

	const settings = useUserSettings();

	const darkModeSettings = useMemo(
		() => find(settings.props, (value) => value.name === 'zappDarkreaderMode')?._content,
		[settings.props]
	);

	const senderIdentifier = useMemo(
		() =>
			replyUserInfo
				? replyUserInfo.name
					? replyUserInfo.name
					: replyUserInfo.email
					? replyUserInfo.email
					: replyUserInfo.id
				: null,
		[replyUserInfo]
	);
	const userColor = useMemo(() => calculateAvatarColor(senderIdentifier || ''), [senderIdentifier]);

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
			switch (darkModeSettings) {
				case 'enabled': {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					messageScrollTo.childNodes[0].style.animation = `${
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
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					messageScrollTo.childNodes[0].style.animation = `${
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
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					messageScrollTo.childNodes[0].style.animation = `${
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

	// If replied message is not present in the loaded history, request history from that message
	useEffect(() => {
		if (repliedMessage == null) {
			// TODO xmpp history request for replied message doesn't work
			xmppClient.requestHistoryBetweenTwoMessage(roomId, repliedMessage, firstMessage.id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<ReplayedTextMessageContainer
				background={isMyMessage ? '#C4D5EF' : 'gray5'}
				padding={{ horizontal: 'small', vertical: 'small' }}
				crossAlignment="flex-start"
				userBorderColor={userColor}
				onClick={scrollTo}
			>
				{senderIdentifier && (
					<BubbleHeader
						senderIdentifier={senderIdentifier}
						notReplayedMessageHeader={false}
						userColor={userColor}
					/>
				)}
				{repliedMessage && repliedMessage.type === 'text' && (
					<MessageWrap color="secondary" overflow="ellipsis" size="small">
						{repliedMessage.text}
					</MessageWrap>
				)}
				{messageTime && <BubbleFooter isMyMessage={false} time={messageTime} />}
			</ReplayedTextMessageContainer>
			<Padding top="small" />
		</>
	);
};

export default RepliedTextMessageSectionView;
