/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import ChatExporter from '../../settings/components/chatExporter/ChatExporter';
import { createMockMember, createMockRoom } from '../../tests/createMock';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { ExportStatus } from '../../types/store/SessionTypes';
import { UserType } from '../../types/store/UserTypes';
import useStore from '../Store';

const roomId = 'roomId';
const groupRoom: RoomBe = createMockRoom({
	id: roomId,
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: false }
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRoom(groupRoom);
});

describe('SessionStoreSlice tests', () => {
	test('Set login info', () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo('id', 'name', 'displayName');
		});
		expect(result.current.session).toStrictEqual({
			id: 'id',
			name: 'name',
			displayName: 'displayName',
			userType: UserType.INTERNAL,
			connections: {
				chats_be: undefined,
				xmpp: undefined,
				websocket: undefined
			},
			filterHasFocus: false
		});
	});

	test('Set initial selected room', () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setSelectedRoomOneToOneGroup(roomId);
		});
		expect(result.current.session.selectedRoomOneToOneGroup).toBe(roomId);
	});

	test('Replace selected room', () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setSelectedRoomOneToOneGroup('oldRoomId');
			result.current.setSelectedRoomOneToOneGroup(roomId);
		});
		expect(result.current.session.selectedRoomOneToOneGroup).toBe('roomId');
	});

	describe('Export chat', () => {
		test('Start chat export', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.setChatExporting(roomId);
			});
			expect(result.current.session.chatExporting).toStrictEqual({
				roomId,
				exporter: new ChatExporter(roomId),
				status: ExportStatus.EXPORTING
			});
		});

		test('End chat export', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.setChatExporting(roomId);
				result.current.setChatExporting();
			});
			expect(result.current.session.chatExporting).toBeUndefined();
		});

		test('Set chat export status', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.setChatExporting(roomId);
				result.current.setChatExportStatus(ExportStatus.DOWNLOADING);
			});
			expect(result.current.session.chatExporting).toStrictEqual({
				roomId,
				exporter: new ChatExporter(roomId),
				status: ExportStatus.DOWNLOADING
			});
		});
	});
});
