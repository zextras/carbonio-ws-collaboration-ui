/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Dropdown, IconButton, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css, FlattenSimpleInterpolation } from 'styled-components';

import usePreview from '../../../hooks/usePreview';
import { AttachmentsApi } from '../../../network';
import { getFilesToUploadArray } from '../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { messageActionType } from '../../../types/store/ActiveConversationTypes';
import { TextMessage } from '../../../types/store/MessageTypes';
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
	disabled?: boolean;
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
	const messageActionsTooltip = t('tooltip.messageActions', 'Message actions');

	const deleteMessageTimeLimitInMinutes = useStore((store) =>
		getCapability(store, CapabilityType.DELETE_MESSAGE_TIME_LIMIT)
	) as number;
	const editMessageTimeLimitInMinutes = useStore((store) =>
		getCapability(store, CapabilityType.EDIT_MESSAGE_TIME_LIMIT)
	) as number;
	const setReferenceMessage = useStore((store) => store.setReferenceMessage);
	const setDraftMessage = useStore((store) => store.setDraftMessage);
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, message.roomId));
	const [dropdownActive, setDropdownActive] = useState(false);
	const [forwardMessageModalIsOpen, setForwardMessageModalIsOpen] = useState<boolean>(false);
	const createSnackbar: any = useContext(SnackbarManagerContext);

	const { onPreviewClick } = usePreview(
		message.attachment ||
			message.forwarded?.attachment || { id: '', name: '', mimeType: '', size: 0 }
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

	const copyMessageAction = useCallback(() => {
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

	const editMessageAction = useCallback(() => {
		setDraftMessage(message.roomId, false, message.text);
		setReferenceMessage(
			message.roomId,
			message.id,
			message.from,
			message.stanzaId,
			messageActionType.EDIT,
			message.attachment
		);
	}, [message, setDraftMessage, setReferenceMessage]);

	const deleteMessageAction = useCallback(() => {
		const attachment = message.attachment || message.forwarded?.attachment;
		if (attachment) {
			AttachmentsApi.deleteAttachment(attachment.id).then(() =>
				xmppClient.sendChatMessageDeletion(message.roomId, message.stanzaId)
			);
		} else {
			xmppClient.sendChatMessageDeletion(message.roomId, message.stanzaId);
		}
	}, [
		message.attachment,
		message.forwarded?.attachment,
		message.stanzaId,
		message.roomId,
		xmppClient
	]);

	const downloadAction = useCallback(() => {
		const attachment = message.attachment || message.forwarded?.attachment;
		if (attachment) {
			const downloadUrl = AttachmentsApi.getURLAttachment(attachment.id);
			const linkTag: HTMLAnchorElement = document.createElement('a');
			document.body.appendChild(linkTag);
			linkTag.href = downloadUrl;
			linkTag.download = attachment.name;
			linkTag.target = '_blank';
			linkTag.click();
			linkTag.remove();
		}
	}, [message.attachment, message.forwarded]);

	const canBeForwarded = useMemo(() => !message.forwarded, [message.forwarded]);

	const canBeEdited = useMemo(() => {
		const inTime =
			!editMessageTimeLimitInMinutes ||
			(editMessageTimeLimitInMinutes &&
				Date.now() <= message.date + editMessageTimeLimitInMinutes * 60000);
		return isMyMessage && inTime && !message.forwarded;
	}, [editMessageTimeLimitInMinutes, isMyMessage, message.date, message.forwarded]);

	const canBeDeleted = useMemo(() => {
		const inTime =
			!deleteMessageTimeLimitInMinutes ||
			(deleteMessageTimeLimitInMinutes &&
				Date.now() <= message.date + deleteMessageTimeLimitInMinutes * 60000);
		return isMyMessage && inTime;
	}, [deleteMessageTimeLimitInMinutes, isMyMessage, message.date]);

	const canBePreviewed = useMemo(() => {
		const attachment = message.attachment || message.forwarded?.attachment;
		return attachment && isPreviewSupported(attachment.mimeType);
	}, [message.attachment, message.forwarded?.attachment]);

	const canBeDownloaded = useMemo(
		() => message.attachment || message.forwarded?.attachment,
		[message.attachment, message.forwarded?.attachment]
	);

	const contextualMenuActions = useMemo(() => {
		const actions: DropDownActionType[] = [];

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
		if (canBeForwarded) {
			actions.push({
				id: 'forward',
				label: forwardActionLabel,
				onClick: onOpenForwardMessageModal
			});
		}

		// Copy the text of a text message to the clipboard
		actions.push({
			id: 'Copy',
			label: copyActionLabel,
			onClick: copyMessageAction
		});

		// Edit functionality
		if (canBeEdited) {
			actions.push({
				id: 'Edit',
				label: editActionLabel,
				onClick: editMessageAction,
				disabled: size(filesToUploadArray) > 0
			});
		}

		// Delete functionality
		if (canBeDeleted) {
			actions.push({
				id: 'Delete',
				label: deleteActionLabel,
				onClick: deleteMessageAction
			});
		}

		// Preview Functionality
		if (canBePreviewed) {
			actions.push({
				id: 'Preview',
				label: previewActionLabel,
				onClick: onPreviewClick
			});
		}

		// Download functionality
		if (canBeDownloaded) {
			actions.push({
				id: 'Download',
				label: downloadActionLabel,
				onClick: downloadAction
			});
		}

		return actions;
	}, [
		replyActionLabel,
		canBeForwarded,
		copyActionLabel,
		copyMessageAction,
		canBeEdited,
		canBeDeleted,
		canBePreviewed,
		canBeDownloaded,
		setReferenceMessage,
		message,
		forwardActionLabel,
		onOpenForwardMessageModal,
		editActionLabel,
		editMessageAction,
		filesToUploadArray,
		deleteActionLabel,
		deleteMessageAction,
		previewActionLabel,
		onPreviewClick,
		downloadActionLabel,
		downloadAction
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
