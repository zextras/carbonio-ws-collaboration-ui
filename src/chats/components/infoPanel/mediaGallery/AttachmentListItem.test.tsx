/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { List } from '@zextras/carbonio-design-system';

import { AttachmentListItem } from './AttachmentListItem';
import { bulkDeleteRoomAttachments } from '../../../../network';
import * as attachmentsApi from '../../../../network/apis/AttachmentsApi';
import { xmppClient } from '../../../../network/xmpp/XMPPClient';
import useStore from '../../../../store/Store';
import { createMockUser } from '../../../../tests/createMock';
import { screen, setup } from '../../../../tests/test-utils';
import type { Attachment } from '../../../../types/network/models/attachmentTypes';

let intersectionCallbacks: Array<IntersectionObserverCallback> = [];

const installCallbackCapturingIntersectionObserver = (): void => {
	intersectionCallbacks = [];
	Object.defineProperty(window, 'IntersectionObserver', {
		writable: true,
		value: vi.fn(function intersectionObserverMock(callback: IntersectionObserverCallback) {
			intersectionCallbacks.push(callback);
			return {
				observe: vi.fn(),
				unobserve: vi.fn(),
				disconnect: vi.fn(),
				takeRecords: vi.fn(() => []),
				root: null,
				rootMargin: '',
				thresholds: []
			};
		})
	});
};

const fireListItemVisible = async (isIntersecting: boolean): Promise<void> => {
	if (intersectionCallbacks.length === 0) {
		throw new Error('IntersectionObserver was never instantiated by the rendered tree');
	}
	const callback = intersectionCallbacks[0];
	await act(async () => {
		callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
	});
};

const renderInList = (attachment: Attachment): ReturnType<typeof setup> =>
	setup(<List>{[<AttachmentListItem key={attachment.id} attachment={attachment} />]}</List>);

vi.mock('../../../../network/apis/RoomsApi', () => ({
	bulkDeleteRoomAttachments: vi.fn()
}));

const mockedBulkDelete = vi.mocked(bulkDeleteRoomAttachments);

const myUserId = 'me';
const otherUserId = 'other-user';
const ghostUserId = 'ghost-user';
const roomId = 'room-1';
const STANZA_ID = 'stanza-123';
const DELETE_BUTTON_TEST_ID = 'mediaGalleryAttachmentDelete-att-1';
const IMAGE_MIME_TYPE = 'image/png';
const IMAGE_ICON_TEST_ID = 'icon: Image';

const buildAttachment = (overrides?: Partial<Attachment>): Attachment => ({
	id: 'att-1',
	name: 'document.pdf',
	size: 2048,
	mimeType: 'application/pdf',
	userId: otherUserId,
	roomId,
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

beforeEach(() => {
	installCallbackCapturingIntersectionObserver();
	useStore.setState({ users: {}, mediaGallery: {} });
	useStore.getState().setLoginInfo({ id: myUserId, name: 'Me' });
	useStore
		.getState()
		.setUserInfo([createMockUser({ id: otherUserId, name: 'Matteo Perdon', email: 'mp@x.com' })]);
	mockedBulkDelete.mockReset();
});

describe('AttachmentListItem', () => {
	test('renders the filename', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ name: 'report.pdf' })} />);
		expect(screen.getByText('report.pdf')).toBeInTheDocument();
	});

	test('renders the file-type icon based on mime type', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ id: 'att-icon' })} />);
		expect(screen.getByTestId('mediaGalleryAttachmentIcon-att-icon')).toBeInTheDocument();
	});

	test('shows the sender display name and formatted size when sender is a known user', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: otherUserId, size: 2048 })} />);
		expect(screen.getByText('Matteo Perdon • 2.00KB')).toBeInTheDocument();
	});

	test('shows "You" when the sender is the current session user', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: myUserId, size: 500 })} />);
		expect(screen.getByText('You • 500B')).toBeInTheDocument();
	});

	test('falls back to "Unknown user" when the sender cannot be resolved', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: ghostUserId, size: 2048 })} />);
		expect(screen.getByText('Unknown user • 2.00KB')).toBeInTheDocument();
	});

	test('omits the size separator when the size is zero', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: myUserId, size: 0 })} />);
		expect(screen.getByText('You')).toBeInTheDocument();
		expect(screen.queryByText(/•/)).not.toBeInTheDocument();
	});

	test('hides the delete button for attachments uploaded by other users', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: otherUserId })} />);
		expect(screen.queryByTestId(DELETE_BUTTON_TEST_ID)).not.toBeInTheDocument();
	});

	test('shows the delete button for attachments uploaded by the current user', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: myUserId })} />);
		expect(screen.getByTestId(DELETE_BUTTON_TEST_ID)).toBeInTheDocument();
	});

	test('opens the confirmation modal with the warning copy on delete click', async () => {
		const { user } = setup(
			<AttachmentListItem attachment={buildAttachment({ userId: myUserId })} />
		);
		await user.click(screen.getByTestId(DELETE_BUTTON_TEST_ID));
		expect(screen.getByTestId('deleteAttachmentModal')).toBeInTheDocument();
		expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
	});

	test('confirming the modal calls the API, removes the row from the store, and sends the XMPP retraction', async () => {
		mockedBulkDelete.mockResolvedValue({ successIds: ['att-1'], failedIds: [] });
		const sendDeletionSpy = vi
			.spyOn(xmppClient, 'sendChatMessageDeletion')
			.mockImplementation(() => undefined);

		const attachment = buildAttachment({ userId: myUserId, stanzaId: STANZA_ID });
		useStore.getState().appendMediaGalleryPage(roomId, [attachment], undefined);

		const { user } = setup(<AttachmentListItem attachment={attachment} />);
		await user.click(screen.getByTestId(DELETE_BUTTON_TEST_ID));
		await user.click(screen.getByRole('button', { name: /yes, delete attachment/i }));

		await waitFor(() => {
			expect(mockedBulkDelete).toHaveBeenCalledWith(roomId, ['att-1']);
		});
		await waitFor(() => {
			expect(useStore.getState().mediaGallery[roomId].attachments).toHaveLength(0);
		});
		expect(sendDeletionSpy).toHaveBeenCalledWith(roomId, STANZA_ID);
	});

	test('skips the XMPP retraction when stanzaId is not available', async () => {
		mockedBulkDelete.mockResolvedValue({ successIds: ['att-1'], failedIds: [] });
		const sendDeletionSpy = vi
			.spyOn(xmppClient, 'sendChatMessageDeletion')
			.mockImplementation(() => undefined);

		const attachment = buildAttachment({ userId: myUserId, stanzaId: undefined });
		useStore.getState().appendMediaGalleryPage(roomId, [attachment], undefined);

		const { user } = setup(<AttachmentListItem attachment={attachment} />);
		await user.click(screen.getByTestId(DELETE_BUTTON_TEST_ID));
		await user.click(screen.getByRole('button', { name: /yes, delete attachment/i }));

		await waitFor(() => {
			expect(useStore.getState().mediaGallery[roomId].attachments).toHaveLength(0);
		});
		expect(sendDeletionSpy).not.toHaveBeenCalled();
	});

	test('keeps the row when the API rejects the request', async () => {
		mockedBulkDelete.mockRejectedValue(new Error('status ko'));

		const attachment = buildAttachment({ userId: myUserId, stanzaId: STANZA_ID });
		useStore.getState().appendMediaGalleryPage(roomId, [attachment], undefined);

		const { user } = setup(<AttachmentListItem attachment={attachment} />);
		await user.click(screen.getByTestId(DELETE_BUTTON_TEST_ID));
		await user.click(screen.getByRole('button', { name: /yes, delete attachment/i }));

		await waitFor(() => {
			expect(mockedBulkDelete).toHaveBeenCalled();
		});
		expect(useStore.getState().mediaGallery[roomId].attachments).toHaveLength(1);
	});

	test('keeps the row when the API returns the id in failedIds', async () => {
		mockedBulkDelete.mockResolvedValue({ successIds: [], failedIds: ['att-1'] });

		const attachment = buildAttachment({ userId: myUserId, stanzaId: STANZA_ID });
		useStore.getState().appendMediaGalleryPage(roomId, [attachment], undefined);

		const { user } = setup(<AttachmentListItem attachment={attachment} />);
		await user.click(screen.getByTestId(DELETE_BUTTON_TEST_ID));
		await user.click(screen.getByRole('button', { name: /yes, delete attachment/i }));

		await waitFor(() => {
			expect(mockedBulkDelete).toHaveBeenCalled();
		});
		expect(useStore.getState().mediaGallery[roomId].attachments).toHaveLength(1);
	});

	test('renders the download button for attachments uploaded by other users', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: otherUserId })} />);
		expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
	});

	test('renders the download button for attachments uploaded by the current user', () => {
		setup(<AttachmentListItem attachment={buildAttachment({ userId: myUserId })} />);
		expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
	});

	test('clicking the download button triggers an authenticated download for the attachment id', async () => {
		const spyGetURL = vi.spyOn(attachmentsApi, 'getURLAttachment');
		const clickSpy = vi
			.spyOn(HTMLAnchorElement.prototype, 'click')
			.mockImplementation(() => undefined);

		const { user } = setup(<AttachmentListItem attachment={buildAttachment()} />);
		await user.click(screen.getByRole('button', { name: /download/i }));

		expect(spyGetURL).toHaveBeenCalledWith('att-1');
		expect(clickSpy).toHaveBeenCalled();
		clickSpy.mockRestore();
	});

	test('keeps the generic icon for unsupported attachment types even after the row becomes visible', async () => {
		renderInList(
			buildAttachment({
				id: 'att-doc',
				mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			})
		);
		await fireListItemVisible(true);
		expect(screen.getByTestId('icon: FileText')).toBeInTheDocument();
	});

	test('shows the generic image icon while the row is not yet visible', () => {
		renderInList(buildAttachment({ id: 'att-img', mimeType: IMAGE_MIME_TYPE }));
		expect(screen.getByTestId(IMAGE_ICON_TEST_ID)).toBeInTheDocument();
	});

	test('applies the thumbnail picture once the row becomes visible', async () => {
		renderInList(buildAttachment({ id: 'att-img', mimeType: IMAGE_MIME_TYPE }));
		await fireListItemVisible(true);
		await waitFor(() => {
			expect(screen.queryByTestId(IMAGE_ICON_TEST_ID)).not.toBeInTheDocument();
		});
	});

	test('applies the thumbnail picture for PDF attachments once the row becomes visible', async () => {
		renderInList(buildAttachment({ id: 'att-pdf', mimeType: 'application/pdf' }));
		await fireListItemVisible(true);
		await waitFor(() => {
			expect(screen.queryByTestId('icon: FilePdf')).not.toBeInTheDocument();
		});
	});

	test('keeps the thumbnail hidden state latched after the row scrolls back out of view', async () => {
		renderInList(buildAttachment({ id: 'att-img', mimeType: IMAGE_MIME_TYPE }));
		await fireListItemVisible(true);
		await fireListItemVisible(false);
		expect(screen.queryByTestId(IMAGE_ICON_TEST_ID)).not.toBeInTheDocument();
	});
});
