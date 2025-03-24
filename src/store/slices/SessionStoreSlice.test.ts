/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import ChatExporter from '../../settings/components/chatExporter/ChatExporter';
import { createMockRoom } from '../../tests/createMock';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { ExportStatus } from '../../types/store/SessionTypes';
import { UserType } from '../../types/store/UserTypes';
import useStore from '../Store';

const roomId = 'roomId';

const groupRoom: RoomBe = createMockRoom({
	id: roomId,
	type: RoomType.GROUP
});

describe('SessionStoreSlice tests', () => {
	test('loginInfo', () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo('id', 'name', 'displayName');
		});
		expect(result.current.session).toStrictEqual({
			id: 'id',
			name: 'name',
			displayName: 'displayName',
			userType: UserType.INTERNAL
		});
	});

	test('queueId', () => {
		const testQueueId = 'test-queueId';
		useStore.getState().setQueueId(testQueueId);
		expect(useStore.getState().session.queueId).toBe(testQueueId);
	});

	describe('selectedRoom', () => {
		test('Set initial selected room', () => {
			useStore.getState().setSelectedRoom(roomId);
			expect(useStore.getState().session.selectedRoom).toBe(roomId);
		});

		test('Change selected room', () => {
			useStore.setState({ session: { selectedRoom: 'selectedRoom1' } });
			useStore.getState().setSelectedRoom('selectedRoom2');
			expect(useStore.getState().session.selectedRoom).toBe('selectedRoom2');
		});

		test('Remove selected room', () => {
			useStore.setState({ session: { selectedRoom: roomId } });
			useStore.getState().setSelectedRoom(undefined);
			expect(useStore.getState().session.selectedRoom).toBeUndefined();
		});
	});

	test('customLogo', () => {
		const logo = 'customLogo';
		useStore.getState().setCustomLogo(logo);
		expect(useStore.getState().session.customLogo).toBe(logo);
	});

	beforeEach(() => {
		useStore.getState().addRoom(groupRoom);
	});
	describe('chatExporting', () => {
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

		test('Change chat export status', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.setChatExporting(roomId);
				result.current.setChatExporting(roomId, ExportStatus.DOWNLOADING);
			});
			expect(result.current.session.chatExporting).toStrictEqual({
				roomId,
				exporter: new ChatExporter(roomId),
				status: ExportStatus.DOWNLOADING
			});
		});
	});
});
