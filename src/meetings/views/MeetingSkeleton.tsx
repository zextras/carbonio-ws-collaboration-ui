/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { disable, enable } from 'darkreader';
import React, { lazy, ReactElement, Suspense, useEffect } from 'react';

import ShimmerMeetingSidebar from './shimmers/ShimmerMeetingSidebar';
import ShimmerMeetingStreamsWrapper from './shimmers/ShimmerMeetingStreamsWrapper';

const LazyMeetingSidebar = lazy(
	() => import(/* webpackChunkName: "MeetingSidebar" */ '../components/Sidebar/MeetingSidebar')
);

const LazyMeetingStreamsWrapper = lazy(
	() => import(/* webpackChunkName: "MeetingSidebar" */ '../components/MeetingStreamsWrapper')
);

const MeetingStreamsWrapper = (): ReactElement => (
	<Suspense fallback={<ShimmerMeetingStreamsWrapper />}>
		<LazyMeetingStreamsWrapper />
	</Suspense>
);

const MeetingSidebar = (): ReactElement => (
	<Suspense fallback={<ShimmerMeetingSidebar />}>
		<LazyMeetingSidebar />
	</Suspense>
);

const MeetingSkeleton = (): ReactElement => {
	useEffect(() => {
		enable(
			{
				sepia: -50
			},
			{
				ignoreImageAnalysis: ['.no-dr-invert *'],
				invert: [],
				css: `
		.tox, .force-white-bg, .tox-swatches-menu, .tox .tox-edit-area__iframe {
			background-color: #fff !important;
			background: #fff !important;
		}
	`,
				ignoreInlineStyle: ['.tox-menu *'],
				disableStyleSheetsProxy: false
			}
		);
		return () => disable();
	}, []);

	return (
		<Container orientation="horizontal" borderRadius="none">
			<MeetingSidebar />
			<MeetingStreamsWrapper />
		</Container>
	);
};

export default MeetingSkeleton;
