/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { handleWsMessageReceived } from './messageReceivedHandler';
import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { MessageType } from '../../../types/store/ChatsRegistryTypes';

const roomId = 'room-test-id';
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

		useStore.getState().setPlaceholderMessage({
			id: tempId,
			roomId,
			text: 'file.pdf',
			tempId,
			attachment: placeholderAttachment
		});

		const confirmedMessageId = 'confirmed-msg-id';

		handleWsMessageReceived({
			type: 'MessageReceived',
			message: {
				id: confirmedMessageId,
				roomId,
				senderId: myUserId,
				text: 'file.pdf',
				createdAt: new Date().toISOString()
			},
			tempId
		});

		const msgs = useStore.getState().chatsRegistry[roomId]?.messages ?? [];
		const confirmed = msgs.find(
			(m) => m.type === MessageType.TEXT_MSG && (m as any).id === confirmedMessageId
		) as any;

		expect(confirmed).toBeDefined();
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

		handleWsMessageReceived({
			type: 'MessageReceived',
			message: {
				id: confirmedMessageId,
				roomId,
				senderId: myUserId,
				text: 'photo.png',
				createdAt: new Date().toISOString(),
				attachment: {
					id: serverAttachmentId,
					name: 'photo.png',
					mimeType: 'image/png',
					size: 2048
				}
			},
			tempId
		});

		const msgs = useStore.getState().chatsRegistry[roomId]?.messages ?? [];
		const confirmed = msgs.find(
			(m) => m.type === MessageType.TEXT_MSG && (m as any).id === confirmedMessageId
		) as any;

		expect(confirmed).toBeDefined();
		expect(confirmed.attachment).toBeDefined();
		expect(confirmed.attachment.id).toBe(serverAttachmentId);
	});

	test('passes area through from nested attachment', () => {
		const tempId = 'temp-id-area';

		useStore.getState().setPlaceholderMessage({
			id: tempId,
			roomId,
			text: 'img.png',
			tempId,
			attachment: { id: tempId, name: 'img.png', mimeType: 'image/png', size: 512, area: '100x200' }
		});

		const confirmedMessageId = 'confirmed-msg-area';

		handleWsMessageReceived({
			type: 'MessageReceived',
			message: {
				id: confirmedMessageId,
				roomId,
				senderId: myUserId,
				text: 'img.png',
				createdAt: new Date().toISOString(),
				attachment: {
					id: 'srv-att-id',
					name: 'img.png',
					mimeType: 'image/png',
					size: 512,
					area: '100x200'
				}
			},
			tempId
		});

		const msgs = useStore.getState().chatsRegistry[roomId]?.messages ?? [];
		const confirmed = msgs.find(
			(m) => m.type === MessageType.TEXT_MSG && (m as any).id === confirmedMessageId
		) as any;

		expect(confirmed?.attachment?.area).toBe('100x200');
	});
});
