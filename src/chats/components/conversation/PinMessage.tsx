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
import { xmppClient } from '../../../network/xmpp/XMPPClient';
import {
	getIsMessageSelectedAlreadyStored,
	getIsPinnedMessageSelected
} from '../../../store/selectors/ActiveConversationsSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { AttachmentMessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { getPinAttachmentColor, getPinAttachmentIcon } from '../../../utils/attachmentUtils';
import { dateToTimestamp } from '../../../utils/dateUtils';
import { scrollToMessage } from '../../../utils/scrollUtils';

interface PinMessageProps {
	pinnedMessage: TextMessage;
}

const ContainerShadow = styled(Container)<{ $isClickable: boolean }>`
	box-shadow: 0 0.25rem 0.25rem 0 rgba(0, 0, 0, 0.25);
	border-radius: 0 0 0.5rem 0.5rem;
	z-index: 2;
	${({ $isClickable }): string | boolean => $isClickable && `cursor: pointer;`}
	${({ $isClickable, theme }): string | boolean =>
		$isClickable &&
		`&:hover {
            background: ${theme.palette.gray6.focus};
        }`}
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

const TextExpanded = styled(Text)`
	white-space: pre-wrap;
	max-height: 7.5rem;
	overflow-y: auto;
	width: 100%;
	height: 100%;
`;

const ExpandedMessageWithThumbnail = ({
	attachment,
	messageText,
	roomId,
	messageDate
}: {
	attachment: AttachmentMessageType;
	messageText: string;
	roomId: string;
	messageDate: number;
}): React.JSX.Element => (
	<Container gap={'0.5rem'} crossAlignment="flex-start">
		<RoundedRow
			padding={'small'}
			background={'gray5'}
			gap={'0.5rem'}
			width={'fill'}
			mainAlignment="flex-start"
		>
			<AttachmentSmallView attachment={attachment} roomId={roomId} messageDate={messageDate} />
			<Text overflow="break-word" color={'gray1'} size="small">
				{attachment.name}
			</Text>
		</RoundedRow>
		{messageText && <TextExpanded overflow="break-word">{messageText}</TextExpanded>}
	</Container>
);

export const PinMessage = ({ pinnedMessage }: PinMessageProps): React.JSX.Element => {
	const [t] = useTranslation();
	const [isExpanded, setIsExpanded] = useState(false);
	const username = useStore((store) => getUserName(store, pinnedMessage.from));
	const { avatarColor } = useAvatarUtilities(pinnedMessage.from);
	const { pinAction, canMessageBePinned } = usePinMessage(pinnedMessage);
	const loggedUserId = useStore(getUserId);
	const clearedAt = useStore((store) => store.rooms[pinnedMessage.roomId].userSettings?.clearedAt);

	const isMessageSelected = useStore((state) =>
		getIsPinnedMessageSelected(state, pinnedMessage.roomId, pinnedMessage.stanzaId)
	);

	const isMessageInStore = useStore((state) =>
		getIsMessageSelectedAlreadyStored(state, pinnedMessage.roomId, pinnedMessage.stanzaId)
	);

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

	const isClickable = useMemo(
		() => !clearedAt || pinnedMessage.date > dateToTimestamp(clearedAt),
		[clearedAt, pinnedMessage.date]
	);

	const goToPinMessage = useCallback(() => {
		if (!isClickable) return;
		useStore.getState().setSelectedPinnedMessage(pinnedMessage.roomId, pinnedMessage.stanzaId);

		setTimeout(() => {
			useStore.getState().setSelectedPinnedMessage(pinnedMessage.roomId, undefined);
		}, 5000);

		if (!isMessageInStore && !isMessageSelected) {
			xmppClient
				.requestMessageResultHistoryToId(pinnedMessage.roomId, pinnedMessage.stanzaId)
				.then(() => {
					scrollToMessage(pinnedMessage.id);
					useStore.getState().setScrollPosition(pinnedMessage.roomId, pinnedMessage.id);
				});
		} else {
			scrollToMessage(pinnedMessage.id);
		}
	}, [
		isClickable,
		isMessageInStore,
		isMessageSelected,
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
					roomId={pinnedMessage.roomId}
					messageDate={pinnedMessage.date}
				/>
			);
		}

		return (
			<Container crossAlignment="flex-start">
				{pinnedMessage.forwarded && <ForwardInfo info={pinnedMessage.forwarded} />}
				<TextExpanded overflow="break-word">{pinnedMessage.text}</TextExpanded>
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
				$isClickable={isClickable}
			>
				<Container mainAlignment={'flex-start'} crossAlignment={'flex-start'} gap="0.5rem">
					<Row mainAlignment="space-between" width="fill" gap={'1rem'}>
						<Row mainAlignment="flex-start" gap="0.5rem">
							<Text color={avatarColor} weight="bold">
								{ownerMessage}:
							</Text>
						</Row>
						<Row mainAlignment="flex-end" gap="0.25rem">
							<StyledText onClick={toggleExpand} color="primary">
								{t('action.hide', 'Hide')}
							</StyledText>
							{canMessageBePinned && (
								<Tooltip label={t('tooltip.unpinMessage', 'Unpin message')}>
									<Button onClick={unpin} icon="Unpin3" type="ghost" color="text" size="large" />
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
			$isClickable={isClickable}
			background="gray6"
			orientation="horizontal"
			mainAlignment="space-between"
			padding={{ horizontal: 'large', vertical: 'medium' }}
			height="fit"
			data-testid={'pin-message'}
			gap={'0.5rem'}
		>
			<Row mainAlignment="flex-start" gap="0.5rem" takeAvailableSpace>
				<Text color={avatarColor} weight="bold">
					{ownerMessage}:
				</Text>
				<Row gap="0.25rem" takeAvailableSpace>
					{pinnedMessage.attachment && (
						<Icon
							icon={getPinAttachmentIcon(pinnedMessage.attachment.mimeType)}
							color={getPinAttachmentColor(pinnedMessage.attachment.mimeType)}
							size="large"
						/>
					)}
					<Text overflow="ellipsis" style={{ flex: 1 }}>
						{pinnedMessage.text || pinnedMessage.attachment?.name}
					</Text>
				</Row>
			</Row>
			<Row mainAlignment="flex-end" gap="0.25rem" flexShrink={0}>
				<StyledText onClick={toggleExpand} color="primary">
					{t('action.showMore', 'Show more')}
				</StyledText>
				{canMessageBePinned && (
					<Tooltip label={t('tooltip.unpinMessage', 'Unpin message')}>
						<Button onClick={unpin} icon="Unpin3" type="ghost" color="text" size="large" />
					</Tooltip>
				)}
			</Row>
		</ContainerShadow>
	);
};
