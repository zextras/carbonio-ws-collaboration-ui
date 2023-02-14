/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Dropdown, IconButton, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css, FlattenSimpleInterpolation } from 'styled-components';

import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { messageActionType } from '../../../types/store/ActiveConversationTypes';
import { MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';
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
	click: () => void;
};

const BubbleContextualMenuDropDown: FC<BubbleContextualMenuDropDownProps> = ({
	message,
	isMyMessage
}) => {
	const xmppClient = useStore(getXmppClient);

	const [t] = useTranslation();
	const replayActionLabel = t('action.reply', 'Reply');
	const copyActionLabel = t('action.copy', 'Copy');
	const deleteActionLabel = t('action.delete', 'Delete');
	const forwardActionLabel = t('action.forward', 'Forward');
	const successfulCopySnackbar = t('feedback.messageCopied', 'Message copied');
	const messageActionsTooltip = t('tooltip.messageActions', ' Message actions');

	const deleteMessageTimeLimitInMinutes = useStore((store) =>
		getCapability(store, CapabilityType.DELETE_MESSAGE_TIME_LIMIT)
	) as number;
	const setReferenceMessage = useStore((store) => store.setReferenceMessage);
	const [dropdownActive, setDropdownActive] = useState(false);
	const [contextualMenuActions, setContextualMenuActions] = useState<DropDownActionType[]>([]);
	const [forwardMessageModalIsOpen, setForwardMessageModalIsOpen] = useState<boolean>(false);
	const createSnackbar: any = useContext(SnackbarManagerContext);

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

	useEffect(() => {
		const actions = [];
		const messageCanBeDeleted =
			deleteMessageTimeLimitInMinutes &&
			Date.now() <= message.date + deleteMessageTimeLimitInMinutes * 60000;

		// Reply functionality
		actions.push({
			id: 'Reply',
			label: replayActionLabel,
			click: () =>
				setReferenceMessage(
					message.roomId,
					message.id,
					message.from,
					message.stanzaId,
					messageActionType.REPLAY
				)
		});

		// Forward message in another chat
		if (!message.forwarded) {
			actions.push({
				id: 'forward',
				label: forwardActionLabel,
				click: onOpenForwardMessageModal
			});
		}

		// Copy the text of a text message to the clipboard
		if (
			typeof window.parent.document.execCommand !== 'undefined' &&
			message.type === MessageType.TEXT_MSG
		) {
			actions.push({
				id: 'Copy',
				label: copyActionLabel,
				click: copyMessage
			});
		}

		// Delete functionality
		if (isMyMessage && messageCanBeDeleted) {
			actions.push({
				id: 'Delete',
				label: deleteActionLabel,
				click: () => {
					xmppClient.sendChatMessageDeletion(message.roomId, message.id);
				}
			});
		}

		setContextualMenuActions(actions);
	}, [
		copyActionLabel,
		copyMessage,
		deleteActionLabel,
		deleteMessageTimeLimitInMinutes,
		dropdownActive,
		forwardActionLabel,
		isMyMessage,
		message,
		onOpenForwardMessageModal,
		replayActionLabel,
		setReferenceMessage,
		xmppClient
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
