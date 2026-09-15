/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import TierIndicator from './TierIndicator';
import { screen, setup } from '../../../tests/test-utils';

const ICON_ARROW_UP = 'icon: ArrowUp';
const ICON_ARROW_DOWN = 'icon: ArrowDown';

describe('TierIndicator', () => {
	it('renders nothing when tier is undefined', () => {
		const { container } = setup(<TierIndicator direction="up" />);
		expect(container).toBeEmptyDOMElement();
	});

	it('fills 1 bar for tier 0 (LOW)', () => {
		setup(<TierIndicator tier={0} direction="up" />);
		expect(screen.getByTestId(ICON_ARROW_UP)).toBeInTheDocument();
	});

	it('fills 2 bars for tier 1 (MEDIUM)', () => {
		setup(<TierIndicator tier={1} direction="up" />);
		expect(screen.getByTestId(ICON_ARROW_UP)).toBeInTheDocument();
	});

	it('fills 3 bars for tier 2 (HIGH)', () => {
		setup(<TierIndicator tier={2} direction="up" />);
		expect(screen.getByTestId(ICON_ARROW_UP)).toBeInTheDocument();
	});

	it('shows ArrowDown icon for direction down', () => {
		setup(<TierIndicator tier={1} direction="down" />);
		expect(screen.getByTestId(ICON_ARROW_DOWN)).toBeInTheDocument();
	});

	it('shows ArrowUp icon for direction up', () => {
		setup(<TierIndicator tier={2} direction="up" />);
		expect(screen.getByTestId(ICON_ARROW_UP)).toBeInTheDocument();
	});
});
