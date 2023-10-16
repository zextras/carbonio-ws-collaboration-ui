/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import AttachmentSmallView from './AttachmentSmallView';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { ForwardedInfo, TextMessage } from '../../../../types/store/MessageTypes';
import { calculateAvatarColor } from '../../../../utils/styleUtils';

const ForwardMessageContainer = styled(Container)`
	border-left: ${({ userBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[userBorderColor]}`};
	border-radius: 0 0.25rem 0.25rem 0;
`;

const MessageWrap = styled(Text)`
	height: inherit;
`;

type ForwardedMessageSectionViewProps = {
	message: TextMessage;
	forwardedInfo: ForwardedInfo;
	isMyMessage: boolean;
};
const ForwardedMessageSectionView: FC<ForwardedMessageSectionViewProps> = ({
	message,
	forwardedInfo,
	isMyMessage
}) => {
	const forwardUsername = useStore((store) => getUserName(store, forwardedInfo.from));

	const [t] = useTranslation();
	const forwardedMessageTooltip = t(
		'tooltip.forwardedMessage',
		`Message forwarded from another chat`
	);

	const userColor = useMemo(() => calculateAvatarColor(forwardUsername || ''), [forwardUsername]);

	const textToShow = useMemo(
		() => (message.attachment && message.text === '' ? message.attachment.name : message.text),
		[message]
	);

	return (
		<Tooltip label={forwardedMessageTooltip}>
			<ForwardMessageContainer
				background={isMyMessage ? '#C4D5EF' : 'gray5'}
				padding={{ horizontal: 'small', vertical: 'small' }}
				orientation="horizontal"
				userBorderColor={userColor}
				crossAlignment="flex-start"
			>
				{message.attachment && (
					<Row wrap="nowrap">
						<AttachmentSmallView attachment={message.attachment} />
					</Row>
				)}
				<Row takeAvailableSpace wrap="nowrap">
					<Container crossAlignment="flex-start">
						{forwardUsername && <BubbleHeader senderId={forwardedInfo.from} />}
						<MessageWrap color="secondary" overflow="break-word">
							{textToShow}
						</MessageWrap>
						<BubbleFooter date={forwardedInfo.date} dateAndTime />
					</Container>
				</Row>
			</ForwardMessageContainer>
		</Tooltip>
	);
};

export default ForwardedMessageSectionView;
