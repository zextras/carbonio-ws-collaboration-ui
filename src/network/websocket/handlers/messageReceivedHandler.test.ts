/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { handleWsMessageReceived } from './messageReceivedHandler';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { MarkerStatus, MessageType } from '../../../types/store/ChatsRegistryTypes';

const roomId = 'room-test-id';
const senderId = 'user-sender-id';
const myUserId = 'my-user-id';

beforeEach(() => {
	const store = useStore.getState();
	const room = createMockRoom({ id: roomId });
	store.addRooms([room]);
	store.setLoginInfo({ id: myUserId, name: 'Me' });
});

describe('handleWsMessageReceived — self-echo attachment guard (Bug 3)', () => {
	test('preserves placeholder attachment when self-echo has no attachment fields', () => {
		const tempId = 'temp-id-abc';
		const placeholderAttachment = {
			id: tempId,
			name: 'file.pdf',
			mimeType: 'application/pdf',
			size: 1024
		};

		// Insert a pending placeholder with an attachment
		const placeholder = createMockTextMessage({
			id: tempId,
			roomId,
			from: myUserId,
			read: MarkerStatus.PENDING,
			tempId,
			attachment: placeholderAttachment
		});
		useStore.getState().setPlaceholderMessage({
			id: tempId,
			roomId,
			text: 'file.pdf',
			tempId,
			attachment: placeholderAttachment
		});

		const confirmedMessageId = 'confirmed-msg-id';

		// Echo arrives WITHOUT attachment fields (attachment still processing on server)
		handleWsMessageReceived({
			messageId: confirmedMessageId,
			roomId,
			senderId: myUserId,
			text: 'file.pdf',
			timestamp: new Date().toISOString(),
			tempId
			// no attachments / attachmentId fields
		});

		const msgs = useStore.getState().chatsRegistry[roomId]?.messages ?? [];
		const confirmed = msgs.find(
			(m) => m.type === MessageType.TEXT_MSG && (m as any).id === confirmedMessageId
		) as any;

		expect(confirmed).toBeDefined();
		// Attachment must NOT have been wiped — the placeholder's attachment should be preserved
		expect(confirmed.attachment).toBeDefined();
		expect(confirmed.attachment.id).toBe(tempId);
		expect(confirmed.attachment.name).toBe('file.pdf');
	});

	test('overwrites placeholder attachment when self-echo carries attachment metadata', () => {
		const tempId = 'temp-id-xyz';
		const placeholderAttachment = {
			id: tempId,
			name: 'photo.png',
			mimeType: 'image/png',
			size: 2048
		};
		const serverAttachmentId = 'server-attachment-id';

		useStore.getState().setPlaceholderMessage({
			id: tempId,
			roomId,
			text: 'photo.png',
			tempId,
			attachment: placeholderAttachment
		});

		const confirmedMessageId = 'confirmed-msg-id-2';

		// Echo arrives WITH attachment fields (server has processed it)
		handleWsMessageReceived({
			messageId: confirmedMessageId,
			roomId,
			senderId: myUserId,
			text: 'photo.png',
			timestamp: new Date().toISOString(),
			tempId,
			attachmentId: serverAttachmentId,
			attachmentName: 'photo.png',
			attachmentMime: 'image/png',
			attachmentSize: 2048
		});

		const msgs = useStore.getState().chatsRegistry[roomId]?.messages ?? [];
		const confirmed = msgs.find(
			(m) => m.type === MessageType.TEXT_MSG && (m as any).id === confirmedMessageId
		) as any;

		expect(confirmed).toBeDefined();
		// Attachment must be updated to the server-provided id
		expect(confirmed.attachment).toBeDefined();
		expect(confirmed.attachment.id).toBe(serverAttachmentId);
	});
});
