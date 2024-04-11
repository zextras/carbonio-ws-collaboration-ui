/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useRef } from 'react';

import { Container, CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useEventListener, { EventName } from '../../hooks/useEventListener';
import useGeneralMeetingControls from '../../hooks/useGeneralMeetingControls';
import { MeetingRoutesParams } from '../../hooks/useRouting';
import { getMeetingViewSelected } from '../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles } from '../../store/selectors/MeetingSelectors';
import { getCustomLogo } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { MeetingViewType } from '../../types/store/ActiveMeetingTypes';
import defaultLogo from '../assets/Logo.png';
import CinemaMode from '../components/cinemaMode/CinemaMode';
import FaceToFaceMode from '../components/faceToFaceMode/FaceToFaceMode';
import GridMode from '../components/gridMode/GridMode';
import MeetingActionsBar from '../components/meetingActionsBar/MeetingActionsBar';
import RecordingInfo from '../components/RecordingInfo';
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
export type MeetingViewProps = {
	children?: ReactElement;
};

const MeetingSkeleton = (): ReactElement => {
	const [t] = useTranslation();
	const mutedByModerator = t(
		'snackbar.mutedByModerator',
		"You've been muted by a moderator, unmute yourself to speak"
	);
	const okLabel = t('action.ok', 'Ok');

	const { meetingId }: MeetingRoutesParams = useParams();

	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId));
	const customLogo = useStore(getCustomLogo);

	const streamsWrapperRef = useRef<HTMLDivElement>(null);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	useGeneralMeetingControls(meetingId);

	const handleMutedEvent = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: mutedByModerator,
			actionLabel: okLabel,
			disableAutoHide: true
		});
	}, [createSnackbar, mutedByModerator, okLabel]);
	useEventListener(EventName.MEMBER_MUTED, handleMutedEvent);

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
				<RecordingInfo meetingId={meetingId} />
				<LogoApp $customLogo={customLogo} />
				<ViewToDisplay>
					<MeetingActionsBar streamsWrapperRef={streamsWrapperRef} />
				</ViewToDisplay>
			</ViewContainer>
		</SkeletonContainer>
	);
};

export default MeetingSkeleton;
