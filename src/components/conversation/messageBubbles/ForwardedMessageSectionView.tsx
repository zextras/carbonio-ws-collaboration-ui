/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import AttachmentSmallView from './AttachmentSmallView';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';
import { getRoomNameSelector, getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { ForwardedMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { calculateAvatarColor } from '../../../utils/styleUtils';

const ForwardMessageContainer = styled(Container)`
	border-left: ${({ userBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[userBorderColor]}`};
	border-radius: 0 0.25rem 0.25rem 0;
`;

const MessageWrap = styled(Text)`
	height: inherit;
`;

type ForwardedMessageSectionViewProps = {
	forwardedMessage: ForwardedMessage;
	isMyMessage: boolean;
	roomId: string;
};
const ForwardedMessageSectionView: FC<ForwardedMessageSectionViewProps> = ({
	forwardedMessage,
	isMyMessage,
	roomId
}) => {
	const forwardUsername = useStore((store) => getUserName(store, forwardedMessage.from));
	const conversationName = useStore((store) => getRoomNameSelector(store, roomId));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));

	const [t] = useTranslation();
	const forwardedMessageTooltip = t(
		'tooltip.forwardedMessage',
		`The message does not belong to ${conversationName}`,
		{ conversationName }
	);
	const forwardedMessageToThisChatTooltip = t(
		'tooltip.forwardedMessageToThisChat',
		`The message does not belong to this Chat`
	);

	const tooltip = useMemo(
		() =>
			roomType === RoomType.ONE_TO_ONE
				? forwardedMessageToThisChatTooltip
				: forwardedMessageTooltip,
		[forwardedMessageToThisChatTooltip, forwardedMessageTooltip, roomType]
	);

	const userColor = useMemo(() => calculateAvatarColor(forwardUsername || ''), [forwardUsername]);

	const textToShow = useMemo(() => {
		if (forwardedMessage.attachment) {
			return forwardedMessage.text !== ''
				? forwardedMessage.text
				: forwardedMessage.attachment.name;
		}
		return forwardedMessage.text;
	}, [forwardedMessage]);

	return (
		<Tooltip label={tooltip}>
			<ForwardMessageContainer
				background={isMyMessage ? '#C4D5EF' : 'gray5'}
				padding={{ horizontal: 'small', vertical: 'small' }}
				orientation="horizontal"
				userBorderColor={userColor}
				crossAlignment="flex-start"
			>
				{forwardedMessage.attachment && (
					<Row wrap="nowrap">
						<AttachmentSmallView attachment={forwardedMessage.attachment} />
					</Row>
				)}
				<Row takeAvailableSpace wrap="nowrap">
					<Container crossAlignment="flex-start">
						{forwardUsername && <BubbleHeader senderId={forwardedMessage.from} />}
						<MessageWrap color="secondary" overflow="break-word">
							{textToShow}
						</MessageWrap>
						<BubbleFooter date={forwardedMessage.date} dateAndTime />
					</Container>
				</Row>
			</ForwardMessageContainer>
		</Tooltip>
	);
};

export default ForwardedMessageSectionView;
