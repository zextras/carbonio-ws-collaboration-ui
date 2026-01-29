/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import {
	Button,
	Container,
	getColor,
	Icon,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import AttachmentSmallView from './messageBubbles/AttachmentSmallView';
import ForwardInfo from './messageBubbles/ForwardInfo';
import useAvatarUtilities from '../../../hooks/useAvatarUtilities';
import { usePinMessage } from '../../../hooks/usePinMessage';
import {
	getIsMessageSelected,
	getIsMessageSelectedAlreadyStored
} from '../../../store/selectors/ActiveConversationsSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { AttachmentMessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { scrollToMessage } from '../../../utils/scrollUtils';

interface PinMessageProps {
	pinnedMessage: TextMessage;
}

const ContainerShadow = styled(Container)`
	box-shadow: 0 0.25rem 0.25rem 0 rgba(0, 0, 0, 0.25);
	border-radius: 0 0 0.5rem 0.5rem;
	z-index: 2;
	cursor: pointer;
	&:hover {
		background: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

const StyledText = styled(Text)`
	cursor: pointer;
	text-decoration: underline;

	&:hover,
	&:focus {
		color: ${({ color, theme }): string => getColor(`${color}.hover`, theme)};
		outline: none;
	}
`;

const RoundedRow = styled(Row)`
	border-radius: 0.25rem;
`;

const getAttachmentIcon = (fileType: string): string => {
	if (fileType === 'application/pdf') {
		return 'FilePdf';
	}
	if (fileType.split('/')[0] === 'image') {
		return 'Image';
	}
	return 'FileText';
};

const getColorIcon = (fileType: string): string => {
	if (fileType.split('/')[0] === 'image' || fileType === 'application/pdf') {
		return 'error';
	}
	return 'primary';
};

const ExpandedMessageWithThumbnail = ({
	attachment,
	messageText
}: {
	attachment: AttachmentMessageType;
	messageText: string;
}): React.JSX.Element => (
	<Container gap={'0.5rem'} crossAlignment="flex-start">
		<RoundedRow
			padding={'small'}
			background={'gray5'}
			gap={'0.5rem'}
			width={'fill'}
			mainAlignment="flex-start"
		>
			<AttachmentSmallView attachment={attachment} />
			<Text overflow="break-word" color={'gray1'} size="small">
				{attachment.name}
			</Text>
		</RoundedRow>
		{messageText && <Text overflow="break-word">{messageText}</Text>}
	</Container>
);

export const PinMessage = ({ pinnedMessage }: PinMessageProps): React.JSX.Element => {
	const [t] = useTranslation();
	const [isExpanded, setIsExpanded] = useState(false);
	const username = useStore((store) => getUserName(store, pinnedMessage.from));
	const { avatarColor } = useAvatarUtilities(pinnedMessage.from);
	const { pinAction, canMessageBePinned } = usePinMessage(pinnedMessage);
	const loggedUserId = useStore(getUserId);
	const clearSearchResults = useStore((state) => state.clearSearchResults);

	const ownerMessage = useMemo(() => {
		if (pinnedMessage.from === loggedUserId) {
			return t('status.you', 'You');
		}

		return username;
	}, [loggedUserId, pinnedMessage.from, t, username]);

	const toggleExpand = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
		e.stopPropagation();
		setIsExpanded((prev) => !prev);
	}, []);

	const isMessageSelected = useStore((state) =>
		getIsMessageSelected(state, pinnedMessage.roomId, pinnedMessage.stanzaId)
	);

	const isMessageSelectedAlreadyStored = useStore((state) =>
		getIsMessageSelectedAlreadyStored(state, pinnedMessage.roomId, pinnedMessage.stanzaId)
	);

	const goToPinMessage = useCallback(() => {
		useStore.getState().setSelectedSearchResult(pinnedMessage.roomId, pinnedMessage.stanzaId);
		if (!isMessageSelectedAlreadyStored && !isMessageSelected) {
			const { xmppClient } = useStore.getState().connections;
			xmppClient
				.requestMessageResultHistoryToId(pinnedMessage.roomId, pinnedMessage.stanzaId)
				.then(() => {
					scrollToMessage(pinnedMessage.id);
					useStore.getState().setScrollPosition(pinnedMessage.roomId, pinnedMessage.id);
					clearSearchResults(pinnedMessage.roomId);
				});
		} else {
			scrollToMessage(pinnedMessage.id);
		}
	}, [
		clearSearchResults,
		isMessageSelected,
		isMessageSelectedAlreadyStored,
		pinnedMessage.id,
		pinnedMessage.roomId,
		pinnedMessage.stanzaId
	]);

	const unpin = useCallback(
		(e: KeyboardEvent | React.MouseEvent<HTMLButtonElement>) => {
			e.stopPropagation();
			pinAction();
		},
		[pinAction]
	);

	const expandedMessage = useMemo(() => {
		if (pinnedMessage.attachment) {
			return (
				<ExpandedMessageWithThumbnail
					attachment={pinnedMessage.attachment}
					messageText={pinnedMessage.text}
				/>
			);
		}

		return (
			<Container crossAlignment="flex-start">
				{pinnedMessage.forwarded && <ForwardInfo info={pinnedMessage.forwarded} />}
				<Text overflow="break-word">{pinnedMessage.text}</Text>
			</Container>
		);
	}, [pinnedMessage]);

	if (isExpanded) {
		return (
			<ContainerShadow
				background="gray6"
				padding={{ horizontal: 'large', vertical: 'medium' }}
				height="fit"
				onClick={goToPinMessage}
			>
				<Container mainAlignment={'flex-start'} crossAlignment={'flex-start'} gap="1rem">
					<Row mainAlignment="space-between" width="fill" gap={'1rem'}>
						<Row mainAlignment="flex-start" gap="0.5rem">
							<Icon icon="Pin3" size="large" />
							<Text color={avatarColor} weight="bold">
								{ownerMessage}:
							</Text>
						</Row>
						<Row mainAlignment="flex-end" gap="0.25rem">
							<StyledText onClick={toggleExpand} color="primary">
								{t('', 'Hide')}
							</StyledText>
							{canMessageBePinned && (
								<Tooltip label={t('', 'Unpin message')}>
									<Button onClick={unpin} icon="Close" type="ghost" color="text" />
								</Tooltip>
							)}
						</Row>
					</Row>
					{expandedMessage}
				</Container>
			</ContainerShadow>
		);
	}

	return (
		<ContainerShadow
			onClick={goToPinMessage}
			background="gray6"
			orientation="horizontal"
			mainAlignment="space-between"
			padding={{ horizontal: 'large', vertical: 'medium' }}
			height="fit"
			data-testid={'pin-message'}
		>
			<Row mainAlignment="flex-start" gap="0.5rem" takeAvailableSpace>
				<Icon icon="Pin3" size="large" />
				<Text color={avatarColor} weight="bold">
					{ownerMessage}:
				</Text>
				{pinnedMessage.attachment && (
					<Icon
						icon={getAttachmentIcon(pinnedMessage.attachment.mimeType)}
						color={getColorIcon(pinnedMessage.attachment.mimeType)}
						size="large"
					/>
				)}
				<Text overflow="ellipsis" style={{ flex: 1 }}>
					{pinnedMessage.text || pinnedMessage.attachment?.name}
				</Text>
			</Row>
			<Row mainAlignment="flex-end" gap="0.25rem" flexShrink={0}>
				<StyledText onClick={toggleExpand} color="primary">
					{t('', 'Show more')}
				</StyledText>
				{canMessageBePinned && (
					<Tooltip label={t('', 'Unpin message')}>
						<Button onClick={unpin} icon="Close" type="ghost" color="text" />
					</Tooltip>
				)}
			</Row>
		</ContainerShadow>
	);
};
