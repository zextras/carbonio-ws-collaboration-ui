/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { lazy, ReactElement, Suspense, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import ShimmerMeetingSidebar from './shimmers/ShimmerMeetingSidebar';
import useGeneralMeetingControls from '../../hooks/useGeneralMeetingControls';
import { MeetingRoutesParams } from '../../hooks/useRouting';
import {
	getMeetingSidebarStatus,
	getMeetingViewSelected
} from '../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles } from '../../store/selectors/MeetingSelectors';
import { getCustomLogo } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { MeetingViewType } from '../../types/store/ActiveMeetingTypes';
import defaultLogo from '../assets/Logo.png';
import CinemaMode from '../components/cinemaMode/CinemaMode';
import SidebarCarousel from '../components/cinemaMode/SidebarCarousel';
import FaceToFaceMode from '../components/faceToFaceMode/FaceToFaceMode';
import GridMode from '../components/gridMode/GridMode';
import MeetingActions from '../components/MeetingActions';

const LazyMeetingSidebar = lazy(
	() => import(/* webpackChunkName: "MeetingSidebar" */ '../components/sidebar/MeetingSidebar')
);
const MeetingSidebar = (): ReactElement => (
	<Suspense fallback={<ShimmerMeetingSidebar />}>
		<LazyMeetingSidebar />
	</Suspense>
);

const SkeletonContainer = styled(Container)`
	overflow: hidden;
	height: 100vh;
`;

const ViewContainer = styled(Container)`
	position: relative;
	overflow-y: hidden;
	padding: 4.25rem;
`;

const LogoApp = styled(Container)`
	position: absolute;
	top: 1rem;
	left: 1rem;
	background-size: contain;
	height: 1.3125rem;
	width: 9.625rem;
	background-repeat: no-repeat;
	background-image: url(${({ customLogo }): string => customLogo || defaultLogo});
`;

const MeetingSkeleton = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const sidebarStatus: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId));
	const customLogo = useStore(getCustomLogo);

	const streamsWrapperRef = useRef<HTMLDivElement>(null);

	useGeneralMeetingControls(meetingId);

	const ViewToDisplay = useMemo(() => {
		if (numberOfTiles <= 2) {
			return <FaceToFaceMode />;
		}
		return meetingViewSelected === MeetingViewType.CINEMA ? <CinemaMode /> : <GridMode />;
	}, [meetingViewSelected, numberOfTiles]);

	const displayCarousel = useMemo(
		() => meetingViewSelected === MeetingViewType.CINEMA && numberOfTiles > 2,
		[meetingViewSelected, numberOfTiles]
	);

	return (
		<SkeletonContainer orientation="horizontal" borderRadius="none">
			<MeetingSidebar />
			<ViewContainer
				ref={streamsWrapperRef}
				background="gray0"
				width={sidebarStatus ? 'fill' : '100%'}
				borderRadius="none"
				padding={{ all: 'large' }}
				crossAlignment="center"
				orientation="horizontal"
			>
				<LogoApp customLogo={customLogo} />
				{ViewToDisplay}
				<MeetingActions streamsWrapperRef={streamsWrapperRef} />
			</ViewContainer>
			{displayCarousel && <SidebarCarousel />}
		</SkeletonContainer>
	);
};

export default MeetingSkeleton;
