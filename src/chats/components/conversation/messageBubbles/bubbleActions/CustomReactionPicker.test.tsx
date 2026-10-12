/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { Picker } from 'emoji-mart';

import CustomReactionPicker from './CustomReactionPicker';
import { setup } from '../../../../../tests/test-utils';

describe('CustomReactionPicker', () => {
	test('uses the em-emoji-picker class already registered by another module instead of its own', () => {
		// another module (e.g. Mails) bundling its own emoji-mart registered em-emoji-picker first
		const registeredPickerClass = vi.fn();
		const getSpy = vi
			.spyOn(customElements, 'get')
			.mockReturnValue(registeredPickerClass as unknown as CustomElementConstructor);

		setup(<CustomReactionPicker onEmojiSelect={vi.fn()} />);

		expect(getSpy).toHaveBeenCalledWith('em-emoji-picker');
		expect(registeredPickerClass).toHaveBeenCalledTimes(1);
		expect(registeredPickerClass).toHaveBeenCalledWith(
			expect.objectContaining({ previewPosition: 'none', skinTonePosition: 'none' })
		);
	});

	test('uses its own Picker class when em-emoji-picker is not registered yet', () => {
		vi.spyOn(customElements, 'get').mockReturnValue(undefined);

		setup(<CustomReactionPicker onEmojiSelect={vi.fn()} />);

		expect(
			screen.getByTestId('custom-reaction-picker').querySelector('em-emoji-picker')
		).toBeInstanceOf(Picker);
	});
});
