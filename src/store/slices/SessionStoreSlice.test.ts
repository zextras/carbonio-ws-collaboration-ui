/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import ChatExporter from '../../settings/components/chatExporter/ChatExporter';
import { createMockRoom } from '../../tests/createMock';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { AttributesList, ExportStatus, Version } from '../../types/store/SessionTypes';
import { UserType } from '../../types/store/UserTypes';
import useStore from '../Store';

const roomId = 'roomId';

const groupRoom: RoomBe = createMockRoom({
	id: roomId,
	type: RoomType.GROUP
});

describe('SessionStoreSlice tests', () => {
	test('loginInfo', () => {
		useStore.getState().setLoginInfo({ id: 'id', name: 'name', displayName: 'displayName' });
		expect(useStore.getState().session).toEqual(
			expect.objectContaining({
				id: 'id',
				name: 'name',
				displayName: 'displayName',
				userType: UserType.INTERNAL,
				_persistedAt: expect.any(Number)
			})
		);
	});

	test('queueId', () => {
		const testQueueId = 'test-queueId';
		useStore.getState().setQueueId(testQueueId);
		expect(useStore.getState().session.queueId).toBe(testQueueId);
	});

	describe('versions', () => {
		test('apiVersion', () => {
			const apiVersion = '1.6.0';
			useStore.getState().setApiVersion(apiVersion);
			expect(useStore.getState().session.apiVersion).toBe(apiVersion);
		});

		test('setSupportedVersions sets the highest version as the default version', () => {
			const versions = ['1.6.1', '1.7.0', '1.6.0'] as Version[];
			useStore.getState().setSupportedVersions(versions);
			expect(useStore.getState().session.supportedVersions).toEqual(versions);
			expect(useStore.getState().session.apiVersion).toEqual('1.7.0');
		});
	});

	describe('attributes', () => {
		test('Set boolean attributes to true', () => {
			useStore.getState().setAttributes({
				carbonioWscPrivateChatCreation: 'TRUE',
				carbonioWscAttachmentUpload: 'TRUE',
				carbonioWscShowMessageReads: 'TRUE',
				carbonioWscShowUsersPresence: 'TRUE',
				carbonioWscVideoCallEnabled: 'TRUE',
				carbonioWscRecordingEnabled: 'TRUE',
				carbonioWscVirtualBackgroundEnabled: 'TRUE'
			});

			const { attributes } = useStore.getState().session;
			expect(attributes?.privateChatCreationEnabled).toBe(true);
			expect(attributes?.attachmentUploadEnabled).toBe(true);
			expect(attributes?.showMessageReads).toBe(true);
			expect(attributes?.showUsersPresence).toBe(true);
			expect(attributes?.videoCallEnabled).toBe(true);
			expect(attributes?.recordingEnabled).toBe(true);
			expect(attributes?.virtualBackgroundEnabled).toBe(true);
		});

		test('Set boolean attributes to false', () => {
			useStore.getState().setAttributes({
				carbonioWscPrivateChatCreation: 'FALSE',
				carbonioWscAttachmentUpload: 'FALSE',
				carbonioWscShowMessageReads: 'FALSE',
				carbonioWscShowUsersPresence: 'FALSE',
				carbonioWscVideoCallEnabled: 'FALSE',
				carbonioWscRecordingEnabled: 'FALSE',
				carbonioWscVirtualBackgroundEnabled: 'FALSE'
			});

			const { attributes } = useStore.getState().session;
			expect(attributes?.privateChatCreationEnabled).toBe(false);
			expect(attributes?.attachmentUploadEnabled).toBe(false);
			expect(attributes?.showMessageReads).toBe(false);
			expect(attributes?.showUsersPresence).toBe(false);
			expect(attributes?.videoCallEnabled).toBe(false);
			expect(attributes?.recordingEnabled).toBe(false);
			expect(attributes?.virtualBackgroundEnabled).toBe(false);
		});

		test('Set number attributes', () => {
			useStore.getState().setAttributes({
				carbonioWscMaxGroupMembers: '32',
				carbonioWscMaxAttachmentSize: '2',
				carbonioWscMaxRoomPictureSize: '2',
				carbonioWscMessageDeleteTimeLimit: '5m',
				carbonioWscMessageEditTimeLimit: '5m'
			});

			const { attributes } = useStore.getState().session;
			expect(attributes?.maxGroupMembers).toBe(32);
			expect(attributes?.maxAttachmentSize).toBe(2);
			expect(attributes?.maxRoomPictureSize).toBe(2);
			expect(attributes?.messageDeleteTimeLimit).toBe(5);
			expect(attributes?.messageEditTimeLimit).toBe(5);
		});

		test('groupChatCreation is set to false is maxGroupMembers is <= 2', () => {
			useStore.getState().setAttributes({
				carbonioWscGroupChatCreation: 'TRUE',
				carbonioWscMaxGroupMembers: '2'
			});
			expect(useStore.getState().session.attributes?.groupChatCreationEnabled).toBe(false);
		});

		test('setCapabilities sets attributes directly', () => {
			const capabilities: AttributesList = {
				privateChatCreationEnabled: true,
				groupChatCreationEnabled: false,
				maxGroupMembers: 16,
				messageDeleteTimeLimit: 10,
				messageEditTimeLimit: 10,
				maxRoomPictureSize: 5,
				attachmentUploadEnabled: true,
				maxAttachmentSize: 50,
				showMessageReads: false,
				showUsersPresence: true,
				videoCallEnabled: true,
				recordingEnabled: false,
				virtualBackgroundEnabled: true
			};
			useStore.getState().setCapabilities(capabilities);
			expect(useStore.getState().session.attributes).toStrictEqual(capabilities);
		});
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
		useStore.getState().addRooms([groupRoom]);
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
