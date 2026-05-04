/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { AttachmentFilterTabs } from './AttachmentFilterTabs';
import useStore from '../../../../store/Store';
import { screen, setup } from '../../../../tests/test-utils';
import { DEFAULT_MEDIA_GALLERY_FILTER } from '../../../../types/store/MediaGalleryTypes';

const roomId = 'room-1';
const myUserId = 'me';
const ALL_TAB_TEST_ID = 'mediaGalleryFilter-all';
const MINE_TAB_TEST_ID = 'mediaGalleryFilter-mine';
const ARIA_SELECTED = 'aria-selected';

beforeEach(() => {
	useStore.getState().setLoginInfo({ id: myUserId, name: 'Me' });
});

describe('AttachmentFilterTabs', () => {
	test('renders both filter tabs with "All" selected by default', () => {
		setup(<AttachmentFilterTabs roomId={roomId} />);
		expect(screen.getByTestId(ALL_TAB_TEST_ID)).toHaveAttribute(ARIA_SELECTED, 'true');
		expect(screen.getByTestId(MINE_TAB_TEST_ID)).toHaveAttribute(ARIA_SELECTED, 'false');
	});

	test('clicking "My attachments" sets the filter to the current user id', async () => {
		const { user } = setup(<AttachmentFilterTabs roomId={roomId} />);
		await user.click(screen.getByTestId(MINE_TAB_TEST_ID));
		expect(useStore.getState().mediaGallery[roomId].filter.userId).toBe(myUserId);
	});

	test('clicking "All attachments" clears the userId filter', async () => {
		useStore
			.getState()
			.setMediaGalleryFilter(roomId, { ...DEFAULT_MEDIA_GALLERY_FILTER, userId: myUserId });
		const { user } = setup(<AttachmentFilterTabs roomId={roomId} />);
		expect(screen.getByTestId(MINE_TAB_TEST_ID)).toHaveAttribute(ARIA_SELECTED, 'true');
		await user.click(screen.getByTestId(ALL_TAB_TEST_ID));
		expect(useStore.getState().mediaGallery[roomId].filter.userId).toBeUndefined();
	});
});
