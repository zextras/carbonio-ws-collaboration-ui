/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import CinemaMode from './CinemaMode/CinemaMode';
import FaceToFaceMode from './FaceToFaceMode';
import GridMode from './GridMode';
import { getMeetingViewSelected } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingViewType } from '../../../../types/store/ActiveMeetingTypes';

const MeetingViewManager = (): ReactElement => {
	const { meetingId }: { meetingId: string } = useParams();
	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId));

	const ViewToDisplay = useMemo(() => {
		if (numberOfTiles <= 2) {
			return <FaceToFaceMode />;
		}
		return meetingViewSelected === MeetingViewType.CINEMA ? <CinemaMode /> : <GridMode />;
	}, [meetingViewSelected, numberOfTiles]);

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
