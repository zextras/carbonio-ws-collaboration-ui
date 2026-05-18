/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import CameraButton from './CameraButton';
import useStore from '../../../store/Store';
import { setup } from '../../../tests/test-utils';

describe('Camera button', () => {
	test('Should render the component', async () => {
		setup(
			<CameraButton
				videoDropdownRef={React.createRef<HTMLDivElement>()}
				isVideoListOpen={false}
				setIsVideoListOpen={vi.fn()}
			/>
		);
		expect(await screen.findByTestId('cameraButton')).toBeVisible();
	});

	test('Toggle list of video inputs', async () => {
		const mockSetIsVideoListOpen = vi.fn();
		useStore.getState().setWebsocketStatus(true);
		const { user } = setup(
			<CameraButton
				videoDropdownRef={React.createRef<HTMLDivElement>()}
				isVideoListOpen={false}
				setIsVideoListOpen={mockSetIsVideoListOpen}
			/>
		);
		const multiButtonToggleList = await screen.findByTestId('icon: ChevronUp');
		await user.click(multiButtonToggleList);
		expect(mockSetIsVideoListOpen).toHaveBeenCalled();
	});

	test('Camera button is disabled when websocket is down', async () => {
		useStore.getState().setWebsocketStatus(false);
		setup(
			<CameraButton
				videoDropdownRef={React.createRef<HTMLDivElement>()}
				isVideoListOpen={false}
				setIsVideoListOpen={vi.fn()}
			/>
		);
		const cameraButton = await screen.findByTestId('cameraButton');
		expect(cameraButton).toBeDisabled();
	});

	test('Camera button is disabled when message broker is down', async () => {
		useStore.getState().setMessageBrokerStatus(false);
		setup(
			<CameraButton
				videoDropdownRef={React.createRef<HTMLDivElement>()}
				isVideoListOpen={false}
				setIsVideoListOpen={vi.fn()}
			/>
		);
		const cameraButton = await screen.findByTestId('cameraButton');
		expect(cameraButton).toBeDisabled();
	});
});
