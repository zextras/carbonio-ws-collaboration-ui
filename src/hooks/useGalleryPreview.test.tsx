/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';
import {
	type PreviewItem,
	type PreviewManagerContextType,
	PreviewsManagerContext
} from '@zextras/carbonio-ui-preview';

import { useGalleryPreview } from './useGalleryPreview';
import { bulkDeleteRoomAttachments, getRoomAttachments } from '../network';
import { xmppClient } from '../network/xmpp/XMPPClient';
import useStore from '../store/Store';
import { ProvidersWrapper } from '../tests/test-utils';
import { Attachment } from '../types/network/models/attachmentTypes';

vi.mock('../network/apis/RoomsApi', () => ({
	bulkDeleteRoomAttachments: vi.fn(),
	getRoomAttachments: vi.fn()
}));

const mockedBulkDelete = vi.mocked(bulkDeleteRoomAttachments);
const mockedGetRoomAttachments = vi.mocked(getRoomAttachments);

const myUserId = 'me';
const roomId = 'room-1';
const IMAGE_MIME = 'image/jpeg';
const ZIP_MIME = 'application/x-zip';
const PDF_MIME = 'application/pdf';
const DELETE_ACTION_ID = 'Trash2Outline';

const buildAttachment = (overrides?: Partial<Attachment>): Attachment => ({
	id: 'att-1',
	name: 'image.jpg',
	size: 2048,
	mimeType: IMAGE_MIME,
	userId: myUserId,
	roomId,
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

type Controller = {
	value: PreviewManagerContextType;
	initPreview: ReturnType<typeof vi.fn>;
	openPreview: ReturnType<typeof vi.fn>;
	emptyPreview: ReturnType<typeof vi.fn>;
	setCurrentIndex: (idx: number) => void;
	getPreviews: () => PreviewItem[];
};

const buildController = (): Controller => {
	let previews: PreviewItem[] = [];
	let currentIndex = -1;
	const initPreview = vi.fn((items: PreviewItem[]) => {
		previews = items;
	});
	const openPreview = vi.fn((id: string) => {
		const idx = previews.findIndex((p) => p.id === id);
		if (idx >= 0) currentIndex = idx;
	});
	const emptyPreview = vi.fn(() => {
		previews = [];
		currentIndex = -1;
	});
	const createPreview = vi.fn();
	const value: PreviewManagerContextType = {
		initPreview: initPreview as PreviewManagerContextType['initPreview'],
		openPreview: openPreview as PreviewManagerContextType['openPreview'],
		emptyPreview: emptyPreview as PreviewManagerContextType['emptyPreview'],
		createPreview: createPreview as PreviewManagerContextType['createPreview'],
		get previews() {
			return previews;
		},
		get currentIndex() {
			return currentIndex;
		}
	};
	return {
		value,
		initPreview,
		openPreview,
		emptyPreview,
		setCurrentIndex: (idx: number): void => {
			currentIndex = idx;
		},
		getPreviews: (): PreviewItem[] => previews
	};
};

const buildWrapper = (
	contextValue: PreviewManagerContextType
): React.FC<{ children: React.ReactNode }> => {
	const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
		<ProvidersWrapper>
			<PreviewsManagerContext.Provider value={contextValue}>
				{children}
			</PreviewsManagerContext.Provider>
		</ProvidersWrapper>
	);
	return Wrapper;
};

const getInitPreviewItems = (mockFn: ReturnType<typeof vi.fn>, callIndex = 0): PreviewItem[] =>
	mockFn.mock.calls[callIndex][0] as PreviewItem[];

const findDeleteAction = (item: PreviewItem): { onClick: (ev: unknown) => void } | undefined => {
	const action = item.actions?.find((a) => a.id === DELETE_ACTION_ID);
	return action as { onClick: (ev: unknown) => void } | undefined;
};

beforeEach(() => {
	useStore.setState({ users: {}, mediaGallery: {} });
	useStore.getState().setLoginInfo({ id: myUserId, name: 'Me' });
	mockedBulkDelete.mockReset();
	mockedGetRoomAttachments.mockReset();
	mockedGetRoomAttachments.mockResolvedValue({ attachments: [], cursor: undefined });
});

describe('useGalleryPreview', () => {
	test('does not init the library until the user opens a preview', () => {
		const ctrl = buildController();
		useStore
			.getState()
			.appendMediaGalleryPage(
				roomId,
				[buildAttachment({ id: 'a1' }), buildAttachment({ id: 'a2' })],
				undefined
			);

		renderHook(() => useGalleryPreview(roomId), { wrapper: buildWrapper(ctrl.value) });

		expect(ctrl.initPreview).not.toHaveBeenCalled();
		expect(ctrl.openPreview).not.toHaveBeenCalled();
	});

	test('onPreviewClick initialises the navigation set with all previewable attachments', () => {
		const ctrl = buildController();
		const a1 = buildAttachment({ id: 'a1', name: 'one.jpg' });
		const a2 = buildAttachment({ id: 'a2', name: 'two.pdf', mimeType: 'application/pdf' });
		useStore.getState().appendMediaGalleryPage(roomId, [a1, a2], undefined);

		const { result } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		act(() => {
			result.current.onPreviewClick(a1);
		});

		expect(ctrl.initPreview).toHaveBeenCalled();
		const items = getInitPreviewItems(ctrl.initPreview);
		expect(items.map((i) => i.id)).toEqual(['a1', 'a2']);
	});

	test('non-previewable attachments are filtered out of the navigation set', () => {
		const ctrl = buildController();
		const a1 = buildAttachment({ id: 'a1', mimeType: 'image/jpeg' });
		const a2 = buildAttachment({ id: 'a2', mimeType: ZIP_MIME, name: 'archive.zip' });
		const a3 = buildAttachment({ id: 'a3', mimeType: PDF_MIME, name: 'doc.pdf' });
		useStore.getState().appendMediaGalleryPage(roomId, [a1, a2, a3], undefined);

		const { result } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		act(() => {
			result.current.onPreviewClick(a1);
		});

		const items = getInitPreviewItems(ctrl.initPreview);
		expect(items.map((i) => i.id)).toEqual(['a1', 'a3']);
	});

	test('hides both chevrons when only one previewable attachment exists', () => {
		const ctrl = buildController();
		const onlyOne = buildAttachment({ id: 'only', mimeType: IMAGE_MIME });
		const zip = buildAttachment({ id: 'zip', mimeType: ZIP_MIME });
		useStore.getState().appendMediaGalleryPage(roomId, [onlyOne, zip], undefined);

		const { result } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		act(() => {
			result.current.onPreviewClick(onlyOne);
		});

		const items = getInitPreviewItems(ctrl.initPreview);
		expect(items).toHaveLength(1);
	});

	test('triggers loadMore when the user reaches the last loaded item and hasMore is true', async () => {
		const ctrl = buildController();
		const a1 = buildAttachment({ id: 'a1' });
		const a2 = buildAttachment({ id: 'a2' });
		useStore.getState().appendMediaGalleryPage(roomId, [a1, a2], 'next-cursor');

		const { result, rerender } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		act(() => {
			result.current.onPreviewClick(a2);
		});
		act(() => {
			ctrl.setCurrentIndex(1);
		});
		rerender();

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledWith(
				roomId,
				expect.objectContaining({ cursor: 'next-cursor' })
			);
		});
	});

	test('does not trigger loadMore at the boundary when hasMore is false', () => {
		const ctrl = buildController();
		const a1 = buildAttachment({ id: 'a1' });
		const a2 = buildAttachment({ id: 'a2' });
		useStore.getState().appendMediaGalleryPage(roomId, [a1, a2], undefined);

		const { result, rerender } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		act(() => {
			result.current.onPreviewClick(a2);
		});
		act(() => {
			ctrl.setCurrentIndex(1);
		});
		rerender();

		expect(mockedGetRoomAttachments).not.toHaveBeenCalled();
	});

	test('delete-from-preview hits the API, removes the attachment from the store, and sends the XMPP retraction', async () => {
		mockedBulkDelete.mockResolvedValue({ successIds: ['a1'], failedIds: [] });
		const sendDeletionSpy = vi
			.spyOn(xmppClient, 'sendChatMessageDeletion')
			.mockImplementation(() => undefined);

		const ctrl = buildController();
		const a1 = buildAttachment({ id: 'a1', stanzaId: 'stanza-1' });
		const a2 = buildAttachment({ id: 'a2' });
		useStore.getState().appendMediaGalleryPage(roomId, [a1, a2], undefined);

		const { result, rerender } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		act(() => {
			result.current.onPreviewClick(a1);
		});
		act(() => {
			ctrl.setCurrentIndex(0);
		});
		rerender();

		const items = getInitPreviewItems(ctrl.initPreview);
		const deleteAction = findDeleteAction(items[0]);
		expect(deleteAction).toBeDefined();
		act(() => {
			deleteAction?.onClick({ preventDefault: () => undefined });
		});

		expect(result.current.pendingDelete?.id).toBe('a1');

		await act(async () => {
			result.current.confirmPendingDelete();
		});

		await waitFor(() => {
			expect(mockedBulkDelete).toHaveBeenCalledWith(roomId, ['a1']);
		});
		await waitFor(() => {
			expect(useStore.getState().mediaGallery[roomId].attachments).toHaveLength(1);
		});
		expect(sendDeletionSpy).toHaveBeenCalledWith(roomId, 'stanza-1');
	});

	test('deleting the only previewable item closes the preview', async () => {
		mockedBulkDelete.mockResolvedValue({ successIds: ['only'], failedIds: [] });

		const ctrl = buildController();
		const onlyOne = buildAttachment({ id: 'only' });
		useStore.getState().appendMediaGalleryPage(roomId, [onlyOne], undefined);

		const { result, rerender } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		act(() => {
			result.current.onPreviewClick(onlyOne);
		});
		act(() => {
			ctrl.setCurrentIndex(0);
		});
		rerender();

		const items = getInitPreviewItems(ctrl.initPreview);
		const deleteAction = findDeleteAction(items[0]);
		act(() => {
			deleteAction?.onClick({ preventDefault: () => undefined });
		});
		await act(async () => {
			result.current.confirmPendingDelete();
		});

		await waitFor(() => {
			expect(ctrl.emptyPreview).toHaveBeenCalled();
		});
	});

	test('delete action is omitted for attachments owned by other users', () => {
		const ctrl = buildController();
		const mine = buildAttachment({ id: 'mine', userId: myUserId });
		const others = buildAttachment({ id: 'others', userId: 'other-user' });
		useStore.getState().appendMediaGalleryPage(roomId, [mine, others], undefined);

		const { result } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		act(() => {
			result.current.onPreviewClick(mine);
		});

		const items = getInitPreviewItems(ctrl.initPreview);
		const mineItem = items.find((i) => i.id === 'mine');
		const othersItem = items.find((i) => i.id === 'others');
		expect(mineItem?.actions?.some((a) => a.id === DELETE_ACTION_ID)).toBe(true);
		expect(othersItem?.actions?.some((a) => a.id === DELETE_ACTION_ID)).toBe(false);
	});

	test('does not hijack the preview when another consumer (e.g. chat-bubble) opens one', () => {
		const ctrl = buildController();
		const a1 = buildAttachment({ id: 'a1' });
		const a2 = buildAttachment({ id: 'a2' });
		useStore.getState().appendMediaGalleryPage(roomId, [a1, a2], undefined);

		const { rerender } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		ctrl.initPreview.mockClear();
		ctrl.openPreview.mockClear();

		const chatBubbleItem = {
			id: 'chat-bubble-item',
			previewType: 'image' as const,
			filename: 'photo.jpg',
			extension: 'JPG',
			size: '1KB',
			actions: [],
			src: 'blob:fake'
		};
		act(() => {
			ctrl.value.createPreview(chatBubbleItem);
			// emulate the library behaviour: createPreview both inits and opens
			(ctrl.value as unknown as { initPreview: (i: PreviewItem[]) => void }).initPreview([
				chatBubbleItem as unknown as PreviewItem
			]);
			ctrl.setCurrentIndex(0);
		});
		rerender();

		expect(ctrl.initPreview).not.toHaveBeenCalledWith(
			expect.arrayContaining([expect.objectContaining({ id: 'a1' })])
		);
		expect(ctrl.openPreview).not.toHaveBeenCalled();
	});

	test('closePreview empties the library and clears the tracked id', () => {
		const ctrl = buildController();
		const a1 = buildAttachment({ id: 'a1' });
		useStore.getState().appendMediaGalleryPage(roomId, [a1], undefined);

		const { result } = renderHook(() => useGalleryPreview(roomId), {
			wrapper: buildWrapper(ctrl.value)
		});

		act(() => {
			result.current.onPreviewClick(a1);
		});
		act(() => {
			result.current.closePreview();
		});

		expect(ctrl.emptyPreview).toHaveBeenCalled();
	});
});
