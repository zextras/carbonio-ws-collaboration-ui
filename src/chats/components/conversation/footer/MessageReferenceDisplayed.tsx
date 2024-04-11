/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useMemo } from 'react';

import { Container, Text, Row, Padding, Avatar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components';

import useMessage from '../../../../hooks/useMessage';
import { getUserSelector } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { ReferenceMessage } from '../../../../types/store/ActiveConversationTypes';
import { TextMessage } from '../../../../types/store/MessageTypes';
import { getThumbnailURL } from '../../../../utils/attachmentUtils';
import { calculateAvatarColor } from '../../../../utils/styleUtils';

const UserName = styled(Text)<{ $labelColor: keyof DefaultTheme['avatarColors'] }>`
	color: ${({ $labelColor, theme }): string => theme.avatarColors[$labelColor]};
`;

const ContactWrapper = styled.div`
	> div {
		margin: 0 0 0 0.3125rem !important;
	}
`;

const BorderContainer = styled(Container)<{
	$customBorderColor: keyof DefaultTheme['avatarColors'];
}>`
	border-left: ${({ $customBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[$customBorderColor]}`};
	border-radius: 0;
`;

const CustomAvatar = styled(Avatar)`
	svg {
		width: calc(2rem * 0.75);
		min-width: calc(2rem * 0.75);
		height: calc(2rem * 0.75);
		min-height: calc(2rem * 0.75);
	}
`;

type MessageReferenceDisplayedProps = {
	referenceMessage: ReferenceMessage;
};

const MessageReferenceDisplayed: React.FC<MessageReferenceDisplayedProps> = ({
	referenceMessage
}) => {
	const [t] = useTranslation();
	const editYourMessageLabel = t('action.editYourMessage', 'Edit your message');
	const replyToYourselfLabel = t('action.replyToYourself', 'Reply to yourself');
	const replyTo = t('action.replyToSomeone', 'Reply to');

	const myId = useStore((store) => store.session.id);
	const senderInfo = useStore((store) => getUserSelector(store, referenceMessage.senderId));
	const unsetReferenceMessage = useStore((store) => store.unsetReferenceMessage);
	const message = useMessage(referenceMessage.roomId, referenceMessage.messageId) as TextMessage;

	// Remove reference view when message is deleted
	useEffect(() => {
		if (message?.deleted) {
			unsetReferenceMessage(message.roomId);
		}
	}, [message, unsetReferenceMessage]);

	const senderIdentifier = useMemo(
		() => (senderInfo ? senderInfo.name || senderInfo.email || senderInfo.id : null),
		[senderInfo]
	);
	const userColor = useMemo(() => calculateAvatarColor(senderIdentifier || ''), [senderIdentifier]);
	const labelAction = useMemo(
		() =>
			// eslint-disable-next-line no-nested-ternary
			referenceMessage.actionType === 'edit'
				? editYourMessageLabel
				: myId === referenceMessage.senderId
					? replyToYourselfLabel
					: replyTo,
		[
			editYourMessageLabel,
			myId,
			referenceMessage.actionType,
			referenceMessage.senderId,
			replyToYourselfLabel,
			replyTo
		]
	);

	const textMessage = useMemo(() => {
		if (message.attachment) {
			//  Always display text (even if it's empty) when editing an attachment description
			if (referenceMessage.actionType === 'edit') {
				return message.text;
			}
			return message.text !== '' ? message.text : message.attachment.name;
		}
		return message.text;
	}, [message, referenceMessage.actionType]);

	const previewURL = useMemo(() => {
		if (referenceMessage.attachment) {
			return getThumbnailURL(referenceMessage.attachment.id, referenceMessage.attachment.mimeType);
		}
		return undefined;
	}, [referenceMessage]);

	return (
		<Row takeAvailableSpace wrap="nowrap" height="100%">
			<BorderContainer
				data-testid="reference-border-message"
				orientation="horizontal"
				$customBorderColor={userColor}
				mainAlignment="flex-start"
				padding={{ left: 'small' }}
				width="fill"
			>
				{referenceMessage.attachment && (
					<Padding right="small">
						<CustomAvatar
							size="large"
							icon="FileTextOutline"
							label={referenceMessage.attachment.name}
							shape="square"
							background={previewURL ? 'gray3' : 'gray0'}
							picture={previewURL}
						/>
					</Padding>
				)}
				<Container mainAlignment="flex-start">
					<Container mainAlignment="flex-start" orientation="horizontal">
						<Text size="medium" color="secondary">
							{labelAction}
						</Text>
						{myId !== referenceMessage.senderId && (
							<ContactWrapper>
								<UserName data-testid="reference-message-username" $labelColor={userColor}>
									{senderIdentifier}
								</UserName>
							</ContactWrapper>
						)}
					</Container>
					<Container crossAlignment="flex-start" padding={{ top: 'small' }}>
						<Text data-testid="reference-message" color="secondary" overflow="ellipsis">
							{textMessage}
						</Text>
					</Container>
				</Container>
			</BorderContainer>
		</Row>
	);
};

export default MessageReferenceDisplayed;
