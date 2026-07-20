/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { CategoryTabs } from './CategoryTabs';
import { screen, setup } from '../../../../tests/test-utils';

const IMAGES_TAB_TEST_ID = 'mediaGalleryCategory-images';
const VIDEOS_TAB_TEST_ID = 'mediaGalleryCategory-videos';
const DOCS_TAB_TEST_ID = 'mediaGalleryCategory-docs';
const ARIA_SELECTED = 'aria-selected';

describe('CategoryTabs', () => {
	test('renders the three category tabs with the given category selected', () => {
		setup(<CategoryTabs category="IMAGES" onCategoryChange={vi.fn()} />);
		expect(screen.getByTestId(IMAGES_TAB_TEST_ID)).toHaveAttribute(ARIA_SELECTED, 'true');
		expect(screen.getByTestId(VIDEOS_TAB_TEST_ID)).toHaveAttribute(ARIA_SELECTED, 'false');
		expect(screen.getByTestId(DOCS_TAB_TEST_ID)).toHaveAttribute(ARIA_SELECTED, 'false');
	});

	test('clicking another tab notifies the parent with its category', async () => {
		const onCategoryChange = vi.fn();
		const { user } = setup(<CategoryTabs category="IMAGES" onCategoryChange={onCategoryChange} />);
		await user.click(screen.getByTestId(VIDEOS_TAB_TEST_ID));
		expect(onCategoryChange).toHaveBeenCalledWith('VIDEOS');
		await user.click(screen.getByTestId(DOCS_TAB_TEST_ID));
		expect(onCategoryChange).toHaveBeenCalledWith('DOCUMENTS');
	});

	test('clicking the already selected tab is a no-op', async () => {
		const onCategoryChange = vi.fn();
		const { user } = setup(<CategoryTabs category="IMAGES" onCategoryChange={onCategoryChange} />);
		await user.click(screen.getByTestId(IMAGES_TAB_TEST_ID));
		expect(onCategoryChange).not.toHaveBeenCalled();
	});
});
