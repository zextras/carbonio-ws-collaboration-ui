/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { TotalCounterChip } from './TotalCounterChip';
import { screen, setup } from '../../../../tests/test-utils';

const CHIP_TEST_ID = 'mediaGalleryTotalCounter';

describe('TotalCounterChip', () => {
	test('renders the plural label for images', () => {
		setup(<TotalCounterChip total={4758} category="IMAGES" />);
		expect(screen.getByTestId(CHIP_TEST_ID)).toHaveTextContent('4758 images');
	});

	test('renders the singular label when the total is one', () => {
		setup(<TotalCounterChip total={1} category="IMAGES" />);
		expect(screen.getByTestId(CHIP_TEST_ID)).toHaveTextContent('1 image');
	});

	test('renders the label of the given category', () => {
		setup(<TotalCounterChip total={7} category="VIDEOS" />);
		expect(screen.getByTestId(CHIP_TEST_ID)).toHaveTextContent('7 videos');
	});

	test('renders nothing when the total is zero or unknown', () => {
		const { unmount } = setup(<TotalCounterChip total={0} category="DOCUMENTS" />);
		expect(screen.queryByTestId(CHIP_TEST_ID)).not.toBeInTheDocument();
		unmount();
		setup(<TotalCounterChip total={undefined} category="DOCUMENTS" />);
		expect(screen.queryByTestId(CHIP_TEST_ID)).not.toBeInTheDocument();
	});
});
