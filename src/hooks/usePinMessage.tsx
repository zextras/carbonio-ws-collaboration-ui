/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ChatApi from '../network/apis/ChatApi';
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

export const usePinMessage = (message: TextMessage | undefined): UsePinMessageReturnType => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();
	const roomId = message?.roomId ?? '';
	const roomType = useStore<RoomType>((store) => getRoomTypeSelector(store, roomId));
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId));
	const pinnedMessage = useStore((store) => getPinnedMessage(store, roomId));

	const stanzaIdToPin = useMemo(() => {
		return message?.editedStanzaId ?? message?.stanzaId ?? '';
	}, [message]);

	const isMessagePinned = useMemo(
		() => (pinnedMessage?.editedStanzaId ?? pinnedMessage?.stanzaId) === stanzaIdToPin,
		[pinnedMessage?.editedStanzaId, pinnedMessage?.stanzaId, stanzaIdToPin]
	);

	const canMessageBePinned = useMemo(
		() => roomType === RoomType.ONE_TO_ONE || amIModerator,
		[amIModerator, roomType]
	);

	const pinActionLabel = useMemo(() => {
		if (!isMessagePinned) {
			return t('action.pin', 'Pin message');
		}
		return t('action.unpin', 'Unpin message');
	}, [isMessagePinned, t]);

	const pinAction = useCallback(() => {
		if (!roomId) return;
		if (pinnedMessage && !isMessagePinned) {
			const modalId = 'pin-modal';
			createModal({
				id: modalId,
				title: t('modal.replacePinMessage', 'Replace pinned message'),
				confirmLabel: t('modal.replacePinConfirm', 'Yes, replace pin'),
				secondaryActionLabel: t('modal.replacePinCancel', 'No, cancel'),
				onConfirm: () => {
					ChatApi.pinMessage(roomId, stanzaIdToPin).catch((err) => {
						console.error('[usePinMessage] pinMessage failed:', err);
					});
					closeModal(modalId);
					useStore.getState().setSelectedPinnedMessage(roomId, undefined);
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
			ChatApi.unpinMessage(roomId, stanzaIdToPin).catch((err) => {
				console.error('[usePinMessage] unpinMessage failed:', err);
			});
			useStore.getState().removePinnedMessage(roomId);
			useStore.getState().setSelectedPinnedMessage(roomId, undefined);
		} else {
			ChatApi.pinMessage(roomId, stanzaIdToPin).catch((err) => {
				console.error('[usePinMessage] pinMessage failed:', err);
			});
			useStore.getState().setSelectedPinnedMessage(roomId, undefined);
		}
	}, [pinnedMessage, isMessagePinned, createModal, t, roomId, stanzaIdToPin, closeModal]);

	return {
		canMessageBePinned,
		pinAction,
		pinActionLabel,
		isMessagePinned
	};
};
