/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo, useState } from 'react';

import { Attachment } from '../../../../types/network/models/attachmentTypes';
import { MarkerStatus, MessageType, TextMessage } from '../../../../types/store/ChatsRegistryTypes';
import { dateToTimestamp } from '../../../../utils/dateUtils';

// Forwarding an attachment means forwarding the message that carries it: build
// the minimal TextMessage the forward API needs from the attachment metadata.
// Possible only when the stanzaId of the original message is known.
export function buildAttachmentForwardMessages(
	attachment: Attachment
): Array<TextMessage> | undefined {
	if (!attachment.stanzaId) return undefined;
	return [
		{
			id: attachment.messageId ?? attachment.stanzaId,
			roomId: attachment.roomId,
			date: dateToTimestamp(attachment.createdAt),
			stanzaId: attachment.stanzaId,
			type: MessageType.TEXT_MSG,
			from: attachment.userId,
			text: '',
			read: MarkerStatus.READ,
			// Forwarding copies the file server-side, so the quota changes: without
			// this field forwardMessages would skip the QUOTA_CHANGED_EVENT dispatch.
			attachment: {
				id: attachment.id,
				name: attachment.name,
				mimeType: attachment.mimeType,
				size: attachment.size
			}
		}
	];
}

type UseAttachmentForwardResult = {
	canForward: boolean;
	modalOpen: boolean;
	openModal: () => void;
	closeModal: () => void;
	messagesToForward: Array<TextMessage> | undefined;
};

const useAttachmentForward = (attachment: Attachment): UseAttachmentForwardResult => {
	const [modalOpen, setModalOpen] = useState(false);
	const openModal = useCallback(() => setModalOpen(true), []);
	const closeModal = useCallback(() => setModalOpen(false), []);

	const messagesToForward = useMemo(() => buildAttachmentForwardMessages(attachment), [attachment]);

	return {
		canForward: messagesToForward !== undefined,
		modalOpen,
		openModal,
		closeModal,
		messagesToForward
	};
};

export default useAttachmentForward;
