/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo, useRef } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useGeneralMeetingControls from '../../hooks/useGeneralMeetingControls';
import useMeetingSnackbars from '../../hooks/useMeetingSnackbars';
import { MeetingRoutesParams } from '../../hooks/useRouting';
import { getMeetingViewSelected } from '../../store/selectors/ActiveMeetingSelectors';
import {
	getMeetingRecordingTimestamp,
	getNumberOfTiles
} from '../../store/selectors/MeetingSelectors';
import { getCustomLogo } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { MeetingViewType } from '../../types/store/ActiveMeetingTypes';
import defaultLogo from '../assets/Logo.png';
import CinemaMode from '../components/cinemaMode/CinemaMode';
import FaceToFaceMode from '../components/faceToFaceMode/FaceToFaceMode';
import GridMode from '../components/gridMode/GridMode';
import MeetingActionsBar from '../components/meetingActionsBar/MeetingActionsBar';
import MeetingSidebar from '../components/sidebar/MeetingSidebar';

const SkeletonContainer = styled(Container)`
	overflow: hidden;
	height: 100vh;
`;

const ViewContainer = styled(Container)`
	position: relative;
	overflow-y: hidden;
	padding: 1rem;
	flex-grow: 1;
`;

const LogoApp = styled(Container)<{ $customLogo: string | false | undefined }>`
	position: absolute;
	top: 1rem;
	left: 1rem;
	background-size: contain;
	height: 1.3125rem;
	width: 9.625rem;
	background-repeat: no-repeat;
	background-image: url(${({ $customLogo }): string => $customLogo || defaultLogo});
`;

const RecordingContainer = styled(Container)`
	position: absolute;
	top: 0;
	border-radius: 0px 0px 20px 20px;
`;

export type MeetingViewProps = {
	children?: ReactElement;
};

const MeetingSkeleton = (): ReactElement => {
	const [t] = useTranslation();
	// TODO translation key
	const meetingRecorded = t('', 'This meeting is being recorded');

	const { meetingId }: MeetingRoutesParams = useParams();

	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId));
	const customLogo = useStore(getCustomLogo);
	const recordingTimestamp = useStore((state) => getMeetingRecordingTimestamp(state, meetingId));

	const streamsWrapperRef = useRef<HTMLDivElement>(null);

	useGeneralMeetingControls(meetingId);
	useMeetingSnackbars(meetingId);

	const ViewToDisplay = useMemo(() => {
		if (numberOfTiles <= 2) {
			return FaceToFaceMode;
		}
		return meetingViewSelected === MeetingViewType.CINEMA ? CinemaMode : GridMode;
	}, [meetingViewSelected, numberOfTiles]);

	return (
		<SkeletonContainer orientation="horizontal" borderRadius="none">
			<MeetingSidebar />
			<ViewContainer
				ref={streamsWrapperRef}
				background="gray0"
				crossAlignment="center"
				orientation="horizontal"
				data-testid="meeting_view_container"
			>
				{!!recordingTimestamp && (
					<RecordingContainer
						height="fit"
						width="fit"
						background="error"
						padding={{ horizontal: 'extralarge', vertical: 'extrasmall' }}
					>
						<Text>{meetingRecorded}</Text>
					</RecordingContainer>
				)}
				<LogoApp $customLogo={customLogo} />
				<ViewToDisplay>
					<MeetingActionsBar streamsWrapperRef={streamsWrapperRef} />
				</ViewToDisplay>
			</ViewContainer>
		</SkeletonContainer>
	);
};

export default MeetingSkeleton;
