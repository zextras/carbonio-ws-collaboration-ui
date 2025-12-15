/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// PiPContext.test.tsx
import React from 'react';

import { render, screen } from '@testing-library/react';

import { PiPContext, PiPProvider, PiPWindow } from './PictureInPictureProvider';
import { setup } from '../../../tests/test-utils';
import { PiPContextType } from '../../../types/pipTypes';

const mockPipWindow = {
	close: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	document: {
		head: {
			appendChild: vi.fn()
		}
	}
};

describe('PiPContext', () => {
	test('pipWindow request', async () => {
		const requestWindowMock = vi.fn(() => Promise.resolve(mockPipWindow));
		(window as any).documentPictureInPicture = {
			requestWindow: requestWindowMock
		};
		const Consumer = (): React.JSX.Element => {
			const { requestPipWindow, pipWindow } = React.useContext(PiPContext)!;
			React.useEffect(() => {
				requestPipWindow(300, 200);
			}, [requestPipWindow]);
			return <div data-testid="pip-status">{pipWindow ? 'open' : 'closed'}</div>;
		};

		setup(
			<PiPProvider>
				<Consumer />
			</PiPProvider>
		);

		expect(await screen.findByTestId('pip-status')).toHaveTextContent('open');
		expect(requestWindowMock).toHaveBeenCalledWith({ width: 300, height: 200 });
	});

	test('isSupported should be false', () => {
		delete (window as any).documentPictureInPicture;

		let contextValue: PiPContextType | undefined;
		const Consumer = (): null => {
			contextValue = React.useContext(PiPContext);
			return null;
		};

		setup(
			<PiPProvider>
				<Consumer />
			</PiPProvider>
		);

		expect(contextValue?.isSupported).toBe(false);
	});

	test('isSupported should be true', () => {
		delete (window as any).documentPictureInPicture;

		(window as any).documentPictureInPicture = {
			requestWindow: vi.fn(() => Promise.resolve(null))
		};

		let contextValue: PiPContextType | undefined;
		const Consumer = (): null => {
			contextValue = React.useContext(PiPContext);
			return null;
		};

		setup(
			<PiPProvider>
				<Consumer />
			</PiPProvider>
		);

		expect(contextValue?.isSupported).toBe(true);
	});
});

describe('PiPWindow', () => {
	test('should render children inside PipWindow', () => {
		const fakeBody = document.createElement('div');
		const fakePipWindow = {
			document: {
				body: fakeBody,
				head: {
					appendChild: vi.fn()
				}
			}
		} as unknown as Window;

		render(
			<PiPWindow pipWindow={fakePipWindow}>
				<div data-testid="child">Test</div>
			</PiPWindow>
		);

		expect(fakeBody.innerHTML).toContain('Test');
	});
});
