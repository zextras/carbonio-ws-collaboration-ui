/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Dropdown, IconButton, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css, FlattenSimpleInterpolation } from 'styled-components';

import usePreview from '../../../hooks/usePreview';
import { AttachmentsApi } from '../../../network';
import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { messageActionType } from '../../../types/store/ActiveConversationTypes';
import { MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';
import { isPreviewSupported } from '../../../utils/attachmentUtils';
import ForwardMessageModal from '../forwardModal/ForwardMessageModal';

export const BubbleContextualMenuDropDownWrapper = styled.div<{
	isActive: boolean;
	theme: any;
	isMyMessage: boolean;
}>`
	position: absolute;
	display: flex;
	padding-top: 0.5rem;
	justify-content: flex-end;
	transition: 0.2s ease-out;
	opacity: 0;
	pointer-events: none;

	> div {
		pointer-events: auto;
	}

	${({ theme, isMyMessage }: { theme: any; isMyMessage: boolean }): FlattenSimpleInterpolation =>
		css`
			top: -0.6875rem;
			right: -0.1875rem;
			width: 3rem;
			height: 1.6875rem;
			background-image: -webkit-radial-gradient(
				75% 50%,
				circle cover,
				${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
				transparent 100%
			);
			background-image: -moz-radial-gradient(
				75% 50%,
				circle cover,
				${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
				transparent 100
			);
			background-image: -o-radial-gradient(
				75% 50%,
				circle cover,
				${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
				transparent 100
			);
			background-image: -ms-radial-gradient(
				75% 50%,
				circle cover,
				${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
				transparent 100
			);
			background-image: radial-gradient(
				75% 50%,
				circle cover,
				${theme.palette[isMyMessage ? 'highlight' : 'gray6'].regular},
				transparent 100%
			);
			color: ${theme.palette.text.regular};
		`};

	${({ isActive }: any): FlattenSimpleInterpolation =>
		isActive &&
		css`
			opacity: 1;
		`};
`;

type BubbleContextualMenuDropDownProps = {
	message: TextMessage;
	isMyMessage: boolean;
};

type DropDownActionType = {
	id: string;
	label: string;
	onClick: () => void;
};

const BubbleContextualMenuDropDown: FC<BubbleContextualMenuDropDownProps> = ({
	message,
	isMyMessage
}) => {
	const xmppClient = useStore(getXmppClient);

	const [t] = useTranslation();
	const copyActionLabel = t('action.copy', 'Copy');
	const deleteActionLabel = t('action.delete', 'Delete');
	const editActionLabel = t('action.edit', 'Edit');
	const replyActionLabel = t('action.reply', 'Reply');
	const forwardActionLabel = t('action.forward', 'Forward');
	const downloadActionLabel = t('action.download', 'Download');
	const previewActionLabel = t('action.preview', 'Preview');
	const successfulCopySnackbar = t('feedback.messageCopied', 'Message copied');
	const messageActionsTooltip = t('tooltip.messageActions', ' Message actions');

	const deleteMessageTimeLimitInMinutes = useStore((store) =>
		getCapability(store, CapabilityType.DELETE_MESSAGE_TIME_LIMIT)
	) as number;
	const editMessageTimeLimitInMinutes = useStore((store) =>
		getCapability(store, CapabilityType.EDIT_MESSAGE_TIME_LIMIT)
	) as number;
	const setReferenceMessage = useStore((store) => store.setReferenceMessage);
	const setDraftMessage = useStore((store) => store.setDraftMessage);
	const [dropdownActive, setDropdownActive] = useState(false);
	const [forwardMessageModalIsOpen, setForwardMessageModalIsOpen] = useState<boolean>(false);
	const createSnackbar: any = useContext(SnackbarManagerContext);

	const { onPreviewClick } = usePreview(
		message.type === MessageType.TEXT_MSG && message.attachment
			? message.attachment
			: { id: '', name: '', mimeType: '', size: 0 }
	);

	const onDropdownOpen = useCallback(() => setDropdownActive(true), [setDropdownActive]);
	const onDropdownClose = useCallback(() => setDropdownActive(false), [setDropdownActive]);

	const onOpenForwardMessageModal = useCallback(
		() => setForwardMessageModalIsOpen(true),
		[setForwardMessageModalIsOpen]
	);

	const onCloseForwardMessageModal = useCallback(
		() => setForwardMessageModalIsOpen(false),
		[setForwardMessageModalIsOpen]
	);

	const copyMessage = useCallback(() => {
		const textToCopy = !message.forwarded ? message.text : message.forwarded.text;
		if (window.parent.navigator.clipboard) {
			window.parent.navigator.clipboard.writeText(textToCopy).then();
		} else {
			const input = window.document.createElement('input');
			input.setAttribute('value', textToCopy);
			window.parent.document.body.appendChild(input);
			input.select();
			window.parent.document.execCommand('copy');
			window.parent.document.body.removeChild(input);
		}
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: successfulCopySnackbar,
			hideButton: true
		});
	}, [createSnackbar, message.forwarded, message.text, successfulCopySnackbar]);

	const deleteMessage = useCallback(() => {
		if (message.attachment) {
			AttachmentsApi.deleteAttachment(message.attachment?.id).then(() =>
				xmppClient.sendChatMessageDeletion(message.roomId, message.id)
			);
		} else {
			xmppClient.sendChatMessageDeletion(message.roomId, message.id);
		}
	}, [message.attachment, message.id, message.roomId, xmppClient]);

	const downloadAction = useCallback(() => {
		if (message.attachment) {
			const downloadUrl = AttachmentsApi.getURLAttachment(message.attachment.id);
			const linkTag: HTMLAnchorElement = document.createElement('a');
			document.body.appendChild(linkTag);
			linkTag.href = downloadUrl;
			linkTag.download = message.attachment.name;
			linkTag.target = '_blank';
			linkTag.click();
			linkTag.remove();
		}
	}, [message.attachment]);

	const contextualMenuActions = useMemo(() => {
		const actions: DropDownActionType[] = [];
		const messageCanBeDeleted =
			!deleteMessageTimeLimitInMinutes ||
			(deleteMessageTimeLimitInMinutes &&
				Date.now() <= message.date + deleteMessageTimeLimitInMinutes * 60000);

		const messageCanBeEdited =
			!editMessageTimeLimitInMinutes ||
			(editMessageTimeLimitInMinutes &&
				Date.now() <= message.date + editMessageTimeLimitInMinutes * 60000);

		// Reply functionality
		actions.push({
			id: 'Reply',
			label: replyActionLabel,
			onClick: () =>
				setReferenceMessage(
					message.roomId,
					message.id,
					message.from,
					message.stanzaId,
					messageActionType.REPLY,
					message.attachment
				)
		});

		// Forward message in another chat
		if (!message.forwarded && !message.attachment) {
			actions.push({
				id: 'forward',
				label: forwardActionLabel,
				onClick: onOpenForwardMessageModal
			});
		}

		// Copy the text of a text message to the clipboard
		if (message.type === MessageType.TEXT_MSG) {
			actions.push({
				id: 'Copy',
				label: copyActionLabel,
				onClick: copyMessage
			});
		}

		// Edit functionality
		if (isMyMessage && messageCanBeEdited && !message.forwarded && !message.attachment) {
			actions.push({
				id: 'Edit',
				label: editActionLabel,
				onClick: () => {
					setDraftMessage(message.roomId, false, message.text);
					setReferenceMessage(
						message.roomId,
						message.id,
						message.from,
						message.stanzaId,
						messageActionType.EDIT
					);
				}
			});
		}

		// Delete functionality
		if (isMyMessage && messageCanBeDeleted) {
			actions.push({
				id: 'Delete',
				label: deleteActionLabel,
				onClick: deleteMessage
			});
		}

		// Download and Preview Functionality
		if (message.attachment) {
			if (isPreviewSupported(message.attachment.mimeType)) {
				actions.push({
					id: 'Preview',
					label: previewActionLabel,
					onClick: onPreviewClick
				});
			}
			actions.push({
				id: 'Download',
				label: downloadActionLabel,
				onClick: downloadAction
			});
		}
		return actions;
	}, [
		deleteMessageTimeLimitInMinutes,
		message.date,
		message.forwarded,
		message.attachment,
		message.type,
		message.roomId,
		message.id,
		message.from,
		message.stanzaId,
		message.text,
		editMessageTimeLimitInMinutes,
		replyActionLabel,
		isMyMessage,
		setReferenceMessage,
		forwardActionLabel,
		onOpenForwardMessageModal,
		copyActionLabel,
		copyMessage,
		editActionLabel,
		setDraftMessage,
		deleteActionLabel,
		deleteMessage,
		downloadActionLabel,
		downloadAction,
		previewActionLabel,
		onPreviewClick
	]);

	return (
		<BubbleContextualMenuDropDownWrapper
			data-testid={`cxtMenu-${message.id}-iconOpen`}
			isMyMessage={isMyMessage}
			isActive={dropdownActive}
		>
			<Dropdown
				data-testid={`cxtMenuDropdown-${message.id}`}
				items={contextualMenuActions}
				onOpen={onDropdownOpen}
				onClose={onDropdownClose}
				disableRestoreFocus
				disablePortal
				placement="right-start"
			>
				<IconButton
					iconColor="currentColor"
					size="small"
					icon="ArrowIosDownward"
					title={messageActionsTooltip}
				/>
			</Dropdown>
			{forwardMessageModalIsOpen && (
				<ForwardMessageModal
					open={forwardMessageModalIsOpen}
					onClose={onCloseForwardMessageModal}
					roomId={message.roomId}
					message={message}
				/>
			)}
		</BubbleContextualMenuDropDownWrapper>
	);
};

export default BubbleContextualMenuDropDown;
