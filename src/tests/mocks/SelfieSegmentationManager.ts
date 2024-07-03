/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

jest.mock('../../meetings/components/virtualBackground/SelfieSegmentationManager', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		initialize: jest.fn(),
		send: jest.fn()
	}))
}));
