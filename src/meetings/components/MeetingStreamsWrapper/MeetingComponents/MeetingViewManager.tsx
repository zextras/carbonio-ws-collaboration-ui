/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import CinemaMode from './CinemaMode';
import FaceToFaceMode from './FaceToFaceMode';
import GridMode from './GridMode';
import { getMeetingViewSelected } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingViewType } from '../../../../types/store/ActiveMeetingTypes';

const MeetingViewManager = (): ReactElement => {
	const { meetingId }: any = useParams();
	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));

	// TODO add check on more of 2 streams visible to change from FaceToFace to Cinema/Grid
	const ViewToDisplay = useMemo(() => {
		switch (meetingViewSelected) {
			case MeetingViewType.CINEMA:
				return <CinemaMode />;
			case MeetingViewType.GRID:
				return <GridMode />;
			default:
				return <FaceToFaceMode />;
		}
	}, [meetingViewSelected]);

	return (
		<Container
			borderRadius="none"
			crossAlignment="flex-start"
			padding={{ left: '0.25rem', right: '3.25rem', top: '2.81rem', bottom: '2.06rem' }}
		>
			{ViewToDisplay}
		</Container>
	);
};

export default MeetingViewManager;