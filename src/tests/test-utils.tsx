/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { render, RenderOptions, RenderResult, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ModalManager, SnackbarManager, ThemeProvider } from '@zextras/carbonio-design-system';
import { I18nextProvider } from 'react-i18next';

import I18nTestFactory from './i18n-test-factory';

interface ProvidersWrapperProps {
	children?: React.ReactElement;
}

const ProvidersWrapper = ({ children }: ProvidersWrapperProps): JSX.Element => {
	const i18n = useMemo(() => {
		const i18nFactory = new I18nTestFactory();
		return i18nFactory.getAppI18n();
	}, []);

	return (
		<I18nextProvider i18n={i18n}>
			<ThemeProvider>
				<ModalManager>
					<SnackbarManager>{children}</SnackbarManager>
				</ModalManager>
			</ThemeProvider>
		</I18nextProvider>
	);
};

function customRender(
	ui: React.ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
	return render(ui, {
		wrapper: ProvidersWrapper,
		...options
	});
}

export function setup(
	...args: Parameters<typeof customRender>
): { user: ReturnType<(typeof userEvent)['setup']> } & ReturnType<typeof render> {
	return {
		user: userEvent.setup({ advanceTimers: jest.advanceTimersByTime }),
		...customRender(...args)
	};
}

export async function triggerObserver(observedElement: HTMLElement): Promise<void> {
	const { calls } = (window.IntersectionObserver as jest.Mock<IntersectionObserver>).mock;
	const [onChange] = calls[calls.length - 1];
	// trigger the intersection on the observed element
	await waitFor(() =>
		onChange([
			{
				target: observedElement,
				isIntersecting: true
			}
		])
	);
}
