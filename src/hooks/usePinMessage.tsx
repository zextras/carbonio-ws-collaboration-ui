/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { chatClient, isWscPure } from '../network/chatClient/ChatClient';
import { getPinnedMessage } from '../store/selectors/ActiveConversationsSelectors';
import { getOwnershipOfTheRoom, getRoomTypeSelector } from '../store/selectors/RoomsSelectors';
import useStore from '../store/Store';
import { TextMessage } from '../types/store/ChatsRegistryTypes';
import { RoomType } from '../types/store/RoomTypes';

interface UsePinMessageReturnType {
	canMessageBePinned: boolean;
	pinAction: () => void;
	pinActionLabel: string;
	isMessagePinned: boolean;
}

export const usePinMessage = (message: TextMessage): UsePinMessageReturnType => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();
	const roomType = useStore<RoomType>((store) => getRoomTypeSelector(store, message.roomId));
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, message.roomId));
	const pinnedMessage = useStore((store) => getPinnedMessage(store, message.roomId));

	const stanzaIdToPin = useMemo(() => {
		if (isWscPure()) {
			// v2 ids are stable across corrections: the pin always targets the
			// message's own id — never the synthetic e_… fastening id the edit
			// projection exposes as editedStanzaId (it is no wire id on v2)
			return message.stanzaId;
		}
		if (message.edited) {
			return message.editedStanzaId ?? message.stanzaId;
		}

		return message.stanzaId;
	}, [message]);

	const isMessagePinned = useMemo(() => {
		if (isWscPure()) {
			// Plain-id comparison: the banner copy may be a GET /pin stub without
			// the editedStanzaId the store projection carries
			return pinnedMessage?.stanzaId === message.stanzaId;
		}
		return (pinnedMessage?.editedStanzaId ?? pinnedMessage?.stanzaId) === stanzaIdToPin;
	}, [pinnedMessage?.editedStanzaId, pinnedMessage?.stanzaId, stanzaIdToPin, message.stanzaId]);

	const canMessageBePinned = useMemo(
		() =>
			chatClient.features.includes('zextras:iq:pin') &&
			(roomType === RoomType.ONE_TO_ONE || amIModerator),
		[amIModerator, roomType]
	);

	const pinActionLabel = useMemo(() => {
		if (!isMessagePinned) {
			return t('action.pin', 'Pin message');
		}
		return t('action.unpin', 'Unpin message');
	}, [isMessagePinned, t]);

	const pinAction = useCallback(() => {
		if (pinnedMessage && !isMessagePinned) {
			const modalId = 'pin-modal';
			createModal({
				id: modalId,
				title: t('modal.replacePinMessage', 'Replace pinned message'),
				confirmLabel: t('modal.replacePinConfirm', 'Yes, replace pin'),
				secondaryActionLabel: t('modal.replacePinCancel', 'No, cancel'),
				onConfirm: () => {
					chatClient.pinMessage(message.roomId, stanzaIdToPin);
					closeModal(modalId);
					useStore.getState().setSelectedPinnedMessage(message.roomId, undefined);
				},
				onSecondaryAction: () => {
					closeModal(modalId);
				},
				onClose: () => {
					closeModal(modalId);
				},
				children: t(
					'modal.replacePinDescription',
					'This conversation already has a pinned message. Only one message can be pinned at a time. Do you want to replace it with this message?'
				)
			});

			return;
		}

		if (isMessagePinned) {
			chatClient.unpinMessage(message.roomId, stanzaIdToPin);
			useStore.getState().removePinnedMessage(message.roomId);
			useStore.getState().setSelectedPinnedMessage(message.roomId, undefined);
		} else {
			chatClient.pinMessage(message.roomId, stanzaIdToPin);
			useStore.getState().setSelectedPinnedMessage(message.roomId, undefined);
		}
	}, [pinnedMessage, isMessagePinned, createModal, t, message.roomId, stanzaIdToPin, closeModal]);

	return {
		canMessageBePinned,
		pinAction,
		pinActionLabel,
		isMessagePinned
	};
};
