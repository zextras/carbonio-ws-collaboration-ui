/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useMemo } from 'react';

import { Container, Text, Row, Avatar, Padding } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useAvatarUtilities from '../../../../hooks/useAvatarUtilities';
import useMessage from '../../../../hooks/useMessage';
import GuestUserLabel from '../../../../meetings/components/GuestUserLabel';
import { getIsUserGuest, getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import {
	messageActionType,
	ReferenceMessage
} from '../../../../types/store/ActiveConversationTypes';
import { TextMessage } from '../../../../types/store/MessageTypes';
import { getThumbnailURL } from '../../../../utils/attachmentUtils';

const BorderContainer = styled(Container)<{
	$customBorderColor: string;
}>`
	border-left: ${({ $customBorderColor }): string => `0.25rem solid ${$customBorderColor}`};
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

const CustomText = styled(Text)`
	flex-shrink: 0;
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
	const senderUserName = useStore((store) => getUserName(store, referenceMessage.senderId));
	const unsetReferenceMessage = useStore((store) => store.unsetReferenceMessage);
	const isUserGuest = useStore((store) => getIsUserGuest(store, referenceMessage.senderId));

	const message = useMessage(referenceMessage.roomId, referenceMessage.messageId) as TextMessage;

	const { avatarColor } = useAvatarUtilities(referenceMessage.senderId);

	// Remove reference view when message is deleted
	useEffect(() => {
		if (message?.deleted) {
			unsetReferenceMessage(message.roomId);
		}
	}, [message, unsetReferenceMessage]);

	const labelAction = useMemo(() => {
		if (referenceMessage.actionType === messageActionType.EDIT) return editYourMessageLabel;
		if (myId === referenceMessage.senderId) return replyToYourselfLabel;
		return replyTo;
	}, [
		editYourMessageLabel,
		myId,
		referenceMessage.actionType,
		referenceMessage.senderId,
		replyTo,
		replyToYourselfLabel
	]);

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
				$customBorderColor={avatarColor}
				mainAlignment="flex-start"
				padding={{ left: 'small' }}
				width="fill"
			>
				<Row takeAvailableSpace wrap="nowrap" height="100%">
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
						<Container mainAlignment="flex-start" orientation="horizontal" gap={'0.25rem'}>
							<CustomText size="medium" color="secondary">
								{labelAction}
							</CustomText>
							{myId !== referenceMessage.senderId && (
								<Row takeAvailableSpace wrap="nowrap" height="100%">
									<Container orientation="horizontal" mainAlignment="flex-start" gap={'0.25rem'}>
										<Text
											data-testid="reference-message-username"
											overflow="ellipsis"
											color={avatarColor}
										>
											{senderUserName}
										</Text>
										{isUserGuest && <GuestUserLabel />}
									</Container>
								</Row>
							)}
						</Container>
						<Container crossAlignment="flex-start" padding={{ top: 'small' }}>
							<Text data-testid="reference-message" color="secondary" overflow="ellipsis">
								{textMessage}
							</Text>
						</Container>
					</Container>
				</Row>
			</BorderContainer>
		</Row>
	);
};

export default MessageReferenceDisplayed;
