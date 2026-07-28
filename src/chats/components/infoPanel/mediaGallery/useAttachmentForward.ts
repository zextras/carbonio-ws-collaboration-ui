/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo, useState } from 'react';

import { Attachment } from '../../../../types/network/models/attachmentTypes';
import { MarkerStatus, MessageType, TextMessage } from '../../../../types/store/ChatsRegistryTypes';
import { dateToTimestamp } from '../../../../utils/dateUtils';

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
	messagesToForward: Array<TextMessage>;
};

const useAttachmentForward = (attachments: Array<Attachment>): UseAttachmentForwardResult => {
	const [modalOpen, setModalOpen] = useState(false);
	const openModal = useCallback(() => setModalOpen(true), []);
	const closeModal = useCallback(() => setModalOpen(false), []);

	const messagesToForward = useMemo(
		() => attachments.flatMap((attachment) => buildAttachmentForwardMessages(attachment) ?? []),
		[attachments]
	);

	return {
		canForward: attachments.length > 0 && messagesToForward.length === attachments.length,
		modalOpen,
		openModal,
		closeModal,
		messagesToForward
	};
};

export default useAttachmentForward;
