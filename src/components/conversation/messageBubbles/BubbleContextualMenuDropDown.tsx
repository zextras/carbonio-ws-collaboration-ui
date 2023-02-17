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
import { EditedMessage, MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';

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
	message: TextMessage | EditedMessage;
	isMyMessage: boolean;
};

type dropDownAction = {
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
	const copyActionLabel = t('action.copy', 'Copy');
	const deleteActionLabel = t('action.delete', 'Delete');
	const editActionLabel = t('action.edit', 'Edit');
	const replayActionLabel = t('action.reply', 'Reply');
	const successfulCopySnackbar = t('feedback.messageCopied', 'Message copied');
	const messageActionsTooltip = t('tooltip.messageActions', ' Message actions');

	const deleteMessageTimeLimitInMinutes = useStore((store) =>
		getCapability(store, CapabilityType.DELETE_MESSAGE_TIME_LIMIT)
	) as number;
	const editMessageTimeLimitInMinutes = useStore((store) =>
		getCapability(store, CapabilityType.EDIT_MESSAGE_TIME_LIMIT)
	) as number;
	const setReferenceMessage = useStore((store) => store.setReferenceMessage);
	const [dropdownActive, setDropdownActive] = useState(false);
	const [contextualMenuActions, setContextualMenuActions] = useState<dropDownAction[]>([]);
	const createSnackbar: any = useContext(SnackbarManagerContext);

	const onDropdownOpen = useCallback(() => setDropdownActive(true), [setDropdownActive]);
	const onDropdownClose = useCallback(() => setDropdownActive(false), [setDropdownActive]);

	const copyMessage = useCallback(() => {
		if (window.parent.navigator.clipboard) {
			window.parent.navigator.clipboard.writeText(message.text).then();
		} else {
			const input = window.document.createElement('input');
			input.setAttribute('value', message.text);
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [message]);

	useEffect(() => {
		const actions = [];
		const messageCanBeDeleted =
			deleteMessageTimeLimitInMinutes &&
			Date.now() <= message.date + deleteMessageTimeLimitInMinutes * 60000;

		const messageCanBeEdited =
			deleteMessageTimeLimitInMinutes &&
			Date.now() <= message.date + editMessageTimeLimitInMinutes * 60000;

		// Delete functionality
		if (isMyMessage && messageCanBeDeleted) {
			actions.push({
				id: 'Delete',
				label: deleteActionLabel,
				click: () => xmppClient.sendChatMessageDeletion(message.roomId, message.id)
			});
		}

		// Edit functionality
		if (isMyMessage && messageCanBeEdited) {
			actions.push({
				id: 'Edit',
				label: editActionLabel,
				click: () =>
					setReferenceMessage(
						message.roomId,
						message.id,
						message.from,
						message.stanzaId,
						messageActionType.EDIT
					)
			});
		}

		// Reply functionality
		// if (
		// 	capabilities.can_reply_to_messages &&
		// 	messageInfos.type !== 'deleted_message'
		// ) {
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
		// }

		// Copy the text of a text message to the clipboard
		if (
			typeof window.parent.document.execCommand !== 'undefined' &&
			(message.type === MessageType.TEXT_MSG || message.type === MessageType.EDITED_MSG)
		) {
			actions.push({
				id: 'Copy',
				label: copyActionLabel,
				click: copyMessage
			});
		}

		setContextualMenuActions(actions);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		copyActionLabel,
		copyMessage,
		dropdownActive,
		message,
		replayActionLabel,
		deleteMessageTimeLimitInMinutes
	]);

	return (
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		// eslint-disable-next-line prettier/prettier
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
		</BubbleContextualMenuDropDownWrapper>
	);
};

export default BubbleContextualMenuDropDown;
