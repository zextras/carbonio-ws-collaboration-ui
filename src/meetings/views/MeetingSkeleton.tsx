/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import { disable, enable } from 'darkreader';
import React, { lazy, ReactElement, Suspense, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import ShimmerMeetingSidebar from './shimmers/ShimmerMeetingSidebar';
import ShimmerMeetingStreamsWrapper from './shimmers/ShimmerMeetingStreamsWrapper';
import useRouting, { PAGE_INFO_TYPE } from '../../hooks/useRouting';
import { getMeetingByMeetingId } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';

const LazyMeetingSidebar = lazy(
	() => import(/* webpackChunkName: "MeetingSidebar" */ '../components/Sidebar/MeetingSidebar')
);

const LazyMeetingStreamsWrapper = lazy(
	() =>
		import(
			/* webpackChunkName: "MeetingStreamsWrapper" */ '../components/MeetingStreamsWrapper/MeetingStreamsWrapper'
		)
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

const CustomContainer = styled(Container)`
	overflow: hidden;
	height: 100vh;
`;

const MeetingSkeleton = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();
	const meeting = useStore((store) => getMeetingByMeetingId(store, meetingId));
	const { goToInfoPage } = useRouting();

	useEffect(() => {
		enable(
			{
				sepia: 0
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

	useEffect(() => {
		if (!meeting) {
			goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
		}
	}, [goToInfoPage, meeting]);

	return (
		<CustomContainer orientation="horizontal" borderRadius="none">
			<MeetingSidebar />
			<MeetingStreamsWrapper />
		</CustomContainer>
	);
};

export default MeetingSkeleton;
