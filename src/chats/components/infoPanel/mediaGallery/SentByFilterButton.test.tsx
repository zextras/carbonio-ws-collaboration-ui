/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { within } from '@testing-library/react';

import { SentByFilterButton } from './SentByFilterButton';
import useStore from '../../../../store/Store';
import { screen, setup } from '../../../../tests/test-utils';
import { DEFAULT_MEDIA_GALLERY_FILTER } from '../../../../types/store/MediaGalleryTypes';

const roomId = 'room-1';
const myUserId = 'me';
const TRIGGER_TEST_ID = 'mediaGallerySentByFilterButton';
const ALL_ITEM_TEST_ID = 'mediaGallerySentBy-all';
const YOU_ITEM_TEST_ID = 'mediaGallerySentBy-you';

beforeEach(() => {
	useStore.getState().setLoginInfo({ id: myUserId, name: 'Me' });
});

describe('SentByFilterButton', () => {
	test('opens the dropdown with the "Sent by" options and "All" checked by default', async () => {
		const { user } = setup(<SentByFilterButton roomId={roomId} />);
		await user.click(screen.getByTestId(TRIGGER_TEST_ID));
		expect(await screen.findByText('Sent by:')).toBeInTheDocument();
		expect(within(screen.getByTestId(ALL_ITEM_TEST_ID)).getByRole('radio')).toBeChecked();
		expect(within(screen.getByTestId(YOU_ITEM_TEST_ID)).getByRole('radio')).not.toBeChecked();
	});

	test('selecting "You" sets the active filter to the logged user id', async () => {
		const { user } = setup(<SentByFilterButton roomId={roomId} />);
		await user.click(screen.getByTestId(TRIGGER_TEST_ID));
		await user.click(await screen.findByTestId(YOU_ITEM_TEST_ID));
		expect(useStore.getState().mediaGallery[roomId].activeFilter.userId).toBe(myUserId);
	});

	test('selecting "All" clears the userId of the active filter', async () => {
		useStore
			.getState()
			.setMediaGalleryActiveFilter(roomId, { ...DEFAULT_MEDIA_GALLERY_FILTER, userId: myUserId });
		const { user } = setup(<SentByFilterButton roomId={roomId} />);
		await user.click(screen.getByTestId(TRIGGER_TEST_ID));
		const youItem = await screen.findByTestId(YOU_ITEM_TEST_ID);
		expect(within(youItem).getByRole('radio')).toBeChecked();
		await user.click(screen.getByTestId(ALL_ITEM_TEST_ID));
		expect(useStore.getState().mediaGallery[roomId].activeFilter.userId).toBeUndefined();
	});
});
