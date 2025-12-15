/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import {
	queries,
	render,
	RenderOptions,
	RenderResult,
	Screen,
	screen,
	waitFor,
	within
} from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ModalManager, SnackbarManager, ThemeProvider } from '@zextras/carbonio-design-system';
import { I18nextProvider } from 'react-i18next';
import { type Mock } from 'vitest';

import { customQueries } from './custom-queries';
import I18nTestFactory from './i18n-test-factory';
import { PiPProvider } from '../meetings/components/pictureInPicture/PictureInPictureProvider';
import { MEETINGS_ROUTES, PAGE_INFO_TYPE, RouterContext } from '../meetings/contexts/routerContext';

interface ProvidersWrapperProps {
	children?: React.ReactNode;
}

export const ProvidersWrapper = ({ children }: ProvidersWrapperProps): JSX.Element => {
	const i18n = useMemo(() => {
		const i18nFactory = new I18nTestFactory();
		return i18nFactory.getAppI18n();
	}, []);

	return (
		<I18nextProvider i18n={i18n}>
			<ThemeProvider>
				<ModalManager>
					<PiPProvider>
						<SnackbarManager>{children}</SnackbarManager>
					</PiPProvider>
				</ModalManager>
			</ThemeProvider>
		</I18nextProvider>
	);
};

const extendedQueries = { ...queries, ...customQueries };
function customRender(
	ui: React.ReactElement,
	options?: Omit<RenderOptions, 'wrapper' | 'queries'>
): RenderResult<typeof extendedQueries> {
	return render(ui, {
		wrapper: ProvidersWrapper,
		queries: extendedQueries,
		...options
	});
}

export function setup(
	...args: Parameters<typeof customRender>
): { user: ReturnType<(typeof userEvent)['setup']> } & ReturnType<typeof customRender> {
	return {
		user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime }),
		...customRender(...args)
	};
}

function customWithin(
	element: Parameters<typeof within<typeof extendedQueries>>[0]
): ReturnType<typeof within<typeof extendedQueries>> {
	return within(element, extendedQueries);
}

const customScreen: Screen<typeof extendedQueries> = { ...screen, ...customWithin(document.body) };

export { customWithin as within, customScreen as screen };

export async function triggerObserver(observedElement: HTMLElement): Promise<void> {
	const { calls } = (window.IntersectionObserver as Mock).mock;
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

export const routerContextSetup = (
	children: React.ReactElement,
	{
		meetingId,
		infoType,
		route = MEETINGS_ROUTES.MEETING
	}: {
		meetingId?: string;
		infoType?: PAGE_INFO_TYPE;
		route?: MEETINGS_ROUTES;
	}
): { user: ReturnType<(typeof userEvent)['setup']> } & ReturnType<typeof customRender> =>
	setup(
		<RouterContext.Provider
			value={{
				route,
				meetingId,
				infoType,
				navigate: vi.fn()
			}}
		>
			<ProvidersWrapper>{children}</ProvidersWrapper>
		</RouterContext.Provider>
	);
