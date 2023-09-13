/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Row } from '@zextras/carbonio-design-system';
import React, { ReactElement, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import CinemaMode from './cinemaMode/CinemaMode';
import FaceToFaceMode from './faceToFaceMode/FaceToFaceMode';
import GridMode from './gridMode/GridMode';
import MeetingActions from './MeetingActions';
import {
	getMeetingSidebarStatus,
	getMeetingViewSelected
} from '../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles } from '../../store/selectors/MeetingSelectors';
import { getCustomLogo } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { MeetingViewType } from '../../types/store/ActiveMeetingTypes';
import defaultLogo from '../assets/Logo.png';

const ViewContainer = styled(Container)`
	position: relative;
	overflow-y: hidden;
	padding: 2rem 3.25rem;
`;

const LogoApp = styled(Container)`
	position: absolute;
	top: 1.25rem;
	left: 1rem;
	background-size: contain;
	height: 1.3125rem;
	background-repeat: no-repeat;
	background-image: url(${({ customLogo }): string => customLogo || defaultLogo});
	width: 9.625rem;
`;
const MeetingViewManager = (): ReactElement => {
	const { meetingId }: { meetingId: string } = useParams();
	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId));
	const sidebarStatus: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	const customLogo = useStore(getCustomLogo);
	const streamsWrapperRef = useRef<HTMLDivElement>(null);

	const ViewToDisplay = useMemo(() => {
		if (numberOfTiles <= 2) {
			return <FaceToFaceMode />;
		}
		return meetingViewSelected === MeetingViewType.CINEMA ? <CinemaMode /> : <GridMode />;
	}, [meetingViewSelected, numberOfTiles]);

	return (
		<ViewContainer
			ref={streamsWrapperRef}
			background={'gray0'}
			width={sidebarStatus ? 'fill' : '100%'}
			borderRadius="none"
			padding={{ all: 'large' }}
			crossAlignment="center"
			orientation="horizontal"
		>
			{customLogo && <LogoApp customLogo={customLogo} />}
			<Row takeAvailableSpace height="fill">
				<Container
					borderRadius="none"
					crossAlignment="flex-start"
					padding={{ left: '0.25rem', right: '3.25rem', top: '2.81rem', bottom: '2.06rem' }}
				>
					{ViewToDisplay}
				</Container>
			</Row>
			<MeetingActions streamsWrapperRef={streamsWrapperRef} />
		</ViewContainer>
	);
};

export default MeetingViewManager;
