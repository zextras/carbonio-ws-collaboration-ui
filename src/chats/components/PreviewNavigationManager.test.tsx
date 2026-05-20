/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
	PreviewItem,
	PreviewManagerContextType,
	PreviewsManagerContext
} from '@zextras/carbonio-ui-preview';

import PreviewNavigationManager from './PreviewNavigationManager';
import { bulkDeleteRoomAttachments, getRoomAttachments } from '../../network';
import { xmppClient } from '../../network/xmpp/XMPPClient';
import useStore from '../../store/Store';
import { screen, setup } from '../../tests/test-utils';
import { Attachment } from '../../types/network/models/attachmentTypes';
import { PreviewNavigationSession } from '../../types/store/PreviewNavigationTypes';

vi.mock('../../network/apis/RoomsApi', () => ({
	getRoomAttachments: vi.fn(),
	bulkDeleteRoomAttachments: vi.fn()
}));

const mockedGetRoomAttachments = vi.mocked(getRoomAttachments);
const mockedBulkDelete = vi.mocked(bulkDeleteRoomAttachments);

const roomId = 'room-1';
const userId = 'me';
const otherId = 'other';

const buildAttachment = (id: string, overrides?: Partial<Attachment>): Attachment => ({
	id,
	name: `${id}.png`,
	size: 1024,
	mimeType: 'image/png',
	userId: otherId,
	roomId,
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

type ContextHandle = {
	value: PreviewManagerContextType;
	setters: {
		setPreviews: (previews: PreviewItem[]) => void;
		setCurrentIndex: (index: number) => void;
	};
	setPreviews: (previews: PreviewItem[]) => void;
	setCurrentIndex: (index: number) => void;
};

const buildContextHandle = (): ContextHandle => {
	const setters = {
		setPreviews: (_: PreviewItem[]): void => undefined,
		setCurrentIndex: (_: number): void => undefined
	};
	return {
		value: {
			createPreview: vi.fn(),
			initPreview: vi.fn(),
			openPreview: vi.fn(),
			emptyPreview: vi.fn(),
			previews: [],
			currentIndex: -1
		},
		setters,
		setPreviews: (previews) => setters.setPreviews(previews),
		setCurrentIndex: (index) => setters.setCurrentIndex(index)
	};
};

const TestHarness: React.FC<{ handle: ContextHandle }> = ({ handle }) => {
	const [previews, setPreviews] = React.useState<PreviewItem[]>([]);
	const [currentIndex, setCurrentIndex] = React.useState<number>(-1);

	const { setters, value: handleValue } = handle;
	setters.setPreviews = setPreviews;
	setters.setCurrentIndex = setCurrentIndex;

	const value = React.useMemo<PreviewManagerContextType>(
		() => ({
			...handleValue,
			previews,
			currentIndex
		}),
		[previews, currentIndex, handleValue]
	);

	return (
		<PreviewsManagerContext.Provider value={value}>
			<PreviewNavigationManager />
		</PreviewsManagerContext.Provider>
	);
};

const setupManager = (): ContextHandle => {
	const handle = buildContextHandle();
	setup(<TestHarness handle={handle} />);
	return handle;
};

beforeEach(() => {
	mockedGetRoomAttachments.mockReset();
	mockedBulkDelete.mockReset();
	useStore.getState().clearPreviewNavigation();
	useStore.setState({ mediaGallery: {} });
	useStore.getState().setLoginInfo({ id: userId, name: 'Me' });
});

describe('PreviewNavigationManager', () => {
	test('renders null when no session is active', () => {
		const { container } = setup(<TestHarness handle={buildContextHandle()} />);
		expect(container).toBeInTheDocument();
		expect(screen.queryByTestId('deleteAttachmentModal')).not.toBeInTheDocument();
	});

	test('calls initPreview with items in source order for a gallery session', async () => {
		const handle = setupManager();
		const session: PreviewNavigationSession = {
			source: 'gallery',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [buildAttachment('a-1'), buildAttachment('a-2'), buildAttachment('a-3')],
			hasMore: false,
			isLoading: false
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		await waitFor(() => {
			expect(handle.value.initPreview).toHaveBeenCalled();
		});
		const lastCall = vi.mocked(handle.value.initPreview).mock.calls.at(-1) ?? [];
		const items = lastCall[0] as PreviewItem[];
		expect(items.map((i) => i.id)).toEqual(['a-1', 'a-2', 'a-3']);
	});

	test('calls initPreview with the array reversed for a chat session', async () => {
		const handle = setupManager();
		const session: PreviewNavigationSession = {
			source: 'chat',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [
				buildAttachment('newest'),
				buildAttachment('middle'),
				buildAttachment('oldest')
			],
			hasMore: false,
			isLoading: false
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		await waitFor(() => {
			expect(handle.value.initPreview).toHaveBeenCalled();
		});
		const lastCall = vi.mocked(handle.value.initPreview).mock.calls.at(-1) ?? [];
		const items = lastCall[0] as PreviewItem[];
		expect(items.map((i) => i.id)).toEqual(['oldest', 'middle', 'newest']);
	});

	test('calls openPreview with the openTargetId once previews contains it', async () => {
		const handle = setupManager();
		const session: PreviewNavigationSession = {
			source: 'gallery',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [buildAttachment('a-1'), buildAttachment('a-2')],
			hasMore: false,
			isLoading: false,
			openTargetId: 'a-2'
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		await waitFor(() => {
			expect(handle.value.initPreview).toHaveBeenCalled();
		});

		// Library has not yet ingested the new array; openPreview should not have fired.
		expect(handle.value.openPreview).not.toHaveBeenCalled();

		act(() => {
			handle.setPreviews([{ id: 'a-1' } as PreviewItem, { id: 'a-2' } as PreviewItem]);
		});

		await waitFor(() => {
			expect(handle.value.openPreview).toHaveBeenCalledWith('a-2');
		});

		// openTargetId still set because currentIndex has not landed yet.
		expect(useStore.getState().previewNavigation.active?.openTargetId).toBe('a-2');

		act(() => {
			handle.setCurrentIndex(1);
		});

		await waitFor(() => {
			expect(useStore.getState().previewNavigation.active?.openTargetId).toBeUndefined();
		});
	});

	test('fires lazy-load near the right edge for a gallery session', async () => {
		const handle = setupManager();
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a-new')],
			cursor: undefined
		});
		const session: PreviewNavigationSession = {
			source: 'gallery',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [
				buildAttachment('a-1'),
				buildAttachment('a-2'),
				buildAttachment('a-3'),
				buildAttachment('a-4')
			],
			nextCursor: 'cursor-1',
			hasMore: true,
			isLoading: false
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		act(() => {
			handle.setPreviews([
				{ id: 'a-1' } as PreviewItem,
				{ id: 'a-2' } as PreviewItem,
				{ id: 'a-3' } as PreviewItem,
				{ id: 'a-4' } as PreviewItem
			]);
			handle.setCurrentIndex(3);
		});

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledWith(
				roomId,
				expect.objectContaining({ cursor: 'cursor-1' })
			);
		});
	});

	test('fires lazy-load near the left edge for a chat session', async () => {
		const handle = setupManager();
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a-older')],
			cursor: undefined
		});
		const session: PreviewNavigationSession = {
			source: 'chat',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [
				buildAttachment('a-1'),
				buildAttachment('a-2'),
				buildAttachment('a-3'),
				buildAttachment('a-4')
			],
			nextCursor: 'cursor-1',
			hasMore: true,
			isLoading: false
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		act(() => {
			handle.setPreviews([
				{ id: 'a-4' } as PreviewItem,
				{ id: 'a-3' } as PreviewItem,
				{ id: 'a-2' } as PreviewItem,
				{ id: 'a-1' } as PreviewItem
			]);
			handle.setCurrentIndex(0);
		});

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledWith(
				roomId,
				expect.objectContaining({ cursor: 'cursor-1' })
			);
		});
	});

	test('does not fire lazy-load when hasMore is false', async () => {
		const handle = setupManager();
		const session: PreviewNavigationSession = {
			source: 'gallery',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [buildAttachment('a-1'), buildAttachment('a-2')],
			hasMore: false,
			isLoading: false
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		act(() => {
			handle.setPreviews([{ id: 'a-1' } as PreviewItem, { id: 'a-2' } as PreviewItem]);
			handle.setCurrentIndex(1);
		});

		await new Promise((resolve) => {
			setTimeout(resolve, 30);
		});
		expect(mockedGetRoomAttachments).not.toHaveBeenCalled();
	});

	test('reopens the previously-displayed item after a chat page append (position preservation)', async () => {
		const handle = setupManager();
		const session: PreviewNavigationSession = {
			source: 'chat',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [buildAttachment('newest'), buildAttachment('oldest')],
			hasMore: false,
			isLoading: false
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		// Library reports: rendered [oldest, newest], user at index 0 (oldest).
		act(() => {
			handle.setPreviews([{ id: 'oldest' } as PreviewItem, { id: 'newest' } as PreviewItem]);
			handle.setCurrentIndex(0);
		});

		vi.mocked(handle.value.openPreview).mockClear();

		// A page of older items is appended → rendered grows on the left.
		act(() => {
			handle.setPreviews([
				{ id: 'older-a' } as PreviewItem,
				{ id: 'older-b' } as PreviewItem,
				{ id: 'oldest' } as PreviewItem,
				{ id: 'newest' } as PreviewItem
			]);
		});

		await waitFor(() => {
			expect(handle.value.openPreview).toHaveBeenCalledWith('oldest');
		});
	});

	test('shows the delete confirmation modal when a preview item triggers onDelete', async () => {
		const handle = setupManager();
		const session: PreviewNavigationSession = {
			source: 'gallery',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [buildAttachment('a-mine', { userId })],
			hasMore: false,
			isLoading: false
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		await waitFor(() => {
			expect(handle.value.initPreview).toHaveBeenCalled();
		});

		const lastInit = vi.mocked(handle.value.initPreview).mock.calls.at(-1) ?? [];
		const items = lastInit[0] as PreviewItem[];
		const deleteAction = items[0].actions?.find((a: { id: string }) => a.id === 'Trash2Outline');
		expect(deleteAction).toBeDefined();

		act(() => {
			deleteAction?.onClick({ preventDefault: vi.fn() } as never);
		});

		expect(await screen.findByTestId('deleteAttachmentModal')).toBeInTheDocument();
	});

	test('omits the delete action when the attachment is owned by another user', async () => {
		const handle = setupManager();
		const session: PreviewNavigationSession = {
			source: 'gallery',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [buildAttachment('a-other', { userId: otherId })],
			hasMore: false,
			isLoading: false
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		await waitFor(() => {
			expect(handle.value.initPreview).toHaveBeenCalled();
		});

		const lastInit = vi.mocked(handle.value.initPreview).mock.calls.at(-1) ?? [];
		const items = lastInit[0] as PreviewItem[];
		expect(items[0].actions?.map((a: { id: string }) => a.id)).toEqual(['DownloadOutline']);
	});

	test('confirming the delete modal calls the API, removes from both slices, and sends XMPP retraction', async () => {
		const handle = setupManager();
		mockedBulkDelete.mockResolvedValue({ successIds: ['a-mine'], failedIds: [] });
		const sendDeletionSpy = vi
			.spyOn(xmppClient, 'sendChatMessageDeletion')
			.mockImplementation(() => undefined);

		const att = buildAttachment('a-mine', { userId, stanzaId: 'stanza-1' });
		useStore.getState().appendMediaGalleryPage(roomId, [att], undefined);

		const session: PreviewNavigationSession = {
			source: 'gallery',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [att],
			hasMore: false,
			isLoading: false
		};
		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});

		await waitFor(() => {
			expect(handle.value.initPreview).toHaveBeenCalled();
		});

		const items = (vi.mocked(handle.value.initPreview).mock.calls.at(-1) ?? [])[0] as PreviewItem[];
		const deleteAction = items[0].actions?.find((a: { id: string }) => a.id === 'Trash2Outline');
		expect(deleteAction).toBeDefined();

		act(() => {
			deleteAction?.onClick({ preventDefault: vi.fn() } as never);
		});

		const user = userEvent.setup();
		await user.click(await screen.findByRole('button', { name: /yes, delete attachment/i }));

		await waitFor(() => {
			expect(mockedBulkDelete).toHaveBeenCalledWith(roomId, ['a-mine']);
		});
		await waitFor(() => {
			expect(useStore.getState().mediaGallery[roomId].attachments).toHaveLength(0);
		});
		// Once the only remaining attachment is gone, the manager tears the session down.
		await waitFor(() => {
			expect(useStore.getState().previewNavigation.active).toBeNull();
		});
		expect(sendDeletionSpy).toHaveBeenCalledWith(roomId, 'stanza-1');
	});

	test('clears the session when the user closes the preview (currentIndex returns to -1)', async () => {
		const handle = setupManager();
		const session: PreviewNavigationSession = {
			source: 'gallery',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [buildAttachment('a-1')],
			hasMore: false,
			isLoading: false
		};

		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});
		act(() => {
			handle.setPreviews([{ id: 'a-1' } as PreviewItem]);
			handle.setCurrentIndex(0);
		});

		await waitFor(() => {
			expect(useStore.getState().previewNavigation.active).not.toBeNull();
		});

		act(() => {
			handle.setCurrentIndex(-1);
		});

		await waitFor(() => {
			expect(useStore.getState().previewNavigation.active).toBeNull();
		});
		expect(handle.value.emptyPreview).toHaveBeenCalled();
	});

	test('falls back to the last item when currentIndex points past the new array length', async () => {
		const handle = setupManager();
		const session: PreviewNavigationSession = {
			source: 'gallery',
			roomId,
			sortBy: 'created_at',
			order: 'desc',
			attachments: [buildAttachment('a-1'), buildAttachment('a-2'), buildAttachment('a-3')],
			hasMore: false,
			isLoading: false
		};
		act(() => {
			useStore.getState().startPreviewNavigation(session);
		});
		act(() => {
			handle.setPreviews([
				{ id: 'a-1' } as PreviewItem,
				{ id: 'a-2' } as PreviewItem,
				{ id: 'a-3' } as PreviewItem
			]);
			handle.setCurrentIndex(2);
		});

		vi.mocked(handle.value.openPreview).mockClear();

		// Simulate one item removed; currentIndex now out of bounds vs. orderedItems.
		act(() => {
			useStore.getState().removePreviewNavigationAttachment('a-3');
		});

		await waitFor(() => {
			expect(handle.value.openPreview).toHaveBeenCalledWith('a-2');
		});
	});
});
