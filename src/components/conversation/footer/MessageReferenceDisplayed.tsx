/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text, Avatar, Padding, Row } from '@zextras/carbonio-design-system';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getMessageSelector } from '../../../store/selectors/MessagesSelectors';
import { getUserSelector } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { ReferenceMessage } from '../../../types/store/ActiveConversationTypes';
import { Message } from '../../../types/store/MessageTypes';
import { calculateAvatarColor } from '../../../utils/styleUtils';

const UserName = styled(Text)`
	color: ${({ labelColor, theme }): string[] => theme.avatarColors[labelColor]};
`;

const ContactWrapper = styled.div`
	> div {
		margin: 0 0 0 0.3125rem !important;
	}
`;

const BorderContainer = styled(Container)`
	border-left: ${({ customBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[customBorderColor]}`};
	border-radius: 0;
`;

type MessageReferenceDisplayedProps = {
	referenceMessage: ReferenceMessage;
};

const MessageReferenceDisplayed: React.FC<MessageReferenceDisplayedProps> = ({
	referenceMessage
}) => {
	const [t] = useTranslation();
	const editYourMessageLabel = t('action.editYourMessage', 'Edit your message');
	const replayToYourselfLabel = t('action.replyToYourself', 'Reply to yourself');
	const replyTo = t('action.replyToSomeone', 'Reply to');

	const myId = useStore((store) => store.session.id);
	const senderInfo = useStore((store) => getUserSelector(store, referenceMessage.senderId));
	const message = useStore<Message | undefined>((store) =>
		getMessageSelector(store, referenceMessage.roomId, referenceMessage.messageId)
	);
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
				? replayToYourselfLabel
				: replyTo,
		[
			editYourMessageLabel,
			myId,
			referenceMessage.actionType,
			referenceMessage.senderId,
			replayToYourselfLabel,
			replyTo
		]
	);

	return (
		<Row takeAvailableSpace wrap="nowrap" height="100%">
			<BorderContainer
				data-testid="reference-border-message"
				orientation="horizontal"
				customBorderColor={userColor}
				mainAlignment="flex-start"
				padding={{ left: 'small' }}
				width="fill"
			>
				{message?.type !== 'text' && (
					<>
						<Avatar size="large" label="Name Lastname" shape="regular" />
						<Padding right="small" />
					</>
				)}
				<Container mainAlignment="flex-start">
					<Container mainAlignment="flex-start" orientation="horizontal">
						<Text size="medium" color="secondary">
							{labelAction}
						</Text>
						{myId !== referenceMessage.senderId && (
							<ContactWrapper>
								<UserName data-testid="reference-message-username" labelColor={userColor}>
									{senderIdentifier}
								</UserName>
							</ContactWrapper>
						)}
					</Container>
					<Container crossAlignment="flex-start" padding={{ top: 'small' }}>
						<Text data-testid="reference-message" color="secondary" overflow="ellipsis">
							{message?.type === 'text' && message?.text}
						</Text>
					</Container>
				</Container>
			</BorderContainer>
		</Row>
	);
};

export default MessageReferenceDisplayed;
