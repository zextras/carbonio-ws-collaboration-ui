/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import MicrophoneButton from './MicrophoneButton';
import useStore from '../../../store/Store';
import { setup } from '../../../tests/test-utils';

const buttonDataTestId = 'microphone-button';

describe('Microphone button', () => {
	test('Should render the component', async () => {
		setup(
			<MicrophoneButton
				audioDropdownRef={React.createRef<HTMLDivElement>()}
				isAudioListOpen={false}
				setIsAudioListOpen={vi.fn()}
			/>
		);
		expect(await screen.findByTestId(buttonDataTestId)).toBeVisible();
	});

	test('Toggle list of audio inputs', async () => {
		const mockSetIsAudioListOpen = vi.fn();
		useStore.getState().setWebsocketStatus(true);
		const { user } = setup(
			<MicrophoneButton
				audioDropdownRef={React.createRef<HTMLDivElement>()}
				isAudioListOpen={false}
				setIsAudioListOpen={mockSetIsAudioListOpen}
			/>
		);
		const multiButtonToggleList = await screen.findByTestId('icon: ChevronUp');
		await user.click(multiButtonToggleList);
		expect(mockSetIsAudioListOpen).toHaveBeenCalled();
	});

	test('Microphone button is disabled when websocket is down', async () => {
		useStore.getState().setWebsocketStatus(false);
		setup(
			<MicrophoneButton
				audioDropdownRef={React.createRef<HTMLDivElement>()}
				isAudioListOpen={false}
				setIsAudioListOpen={vi.fn()}
			/>
		);
		expect(await screen.findByTestId(buttonDataTestId)).toBeDisabled();
	});

	test('Microphone button is disabled when message broker is down', async () => {
		useStore.getState().setMessageBrokerStatus(false);
		setup(
			<MicrophoneButton
				audioDropdownRef={React.createRef<HTMLDivElement>()}
				isAudioListOpen={false}
				setIsAudioListOpen={vi.fn()}
			/>
		);
		expect(await screen.findByTestId(buttonDataTestId)).toBeDisabled();
	});
});
