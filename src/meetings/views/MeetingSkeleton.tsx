/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { lazy, ReactElement, Suspense } from 'react';

import ShimmerMeetingSidebar from './shimmers/ShimmerMeetingSidebar';
import ShimmerMeetingStreamsWrapper from './shimmers/ShimmerMeetingStreamsWrapper';

const LazyMeetingSidebar = lazy(
	() => import(/* webpackChunkName: "MeetingSidebar" */ '../components/MeetingSidebar')
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

const MeetingSkeleton = (): ReactElement => (
	<Container orientation="horizontal" borderRadius="none">
		<MeetingSidebar />
		<MeetingStreamsWrapper />
	</Container>
);

export default MeetingSkeleton;
