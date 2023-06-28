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
import { getMeetingViewSelected } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingViewType } from '../../../../types/store/MeetingTypes';

const MeetingViewManager = (): ReactElement => {
	const { meetingId }: any = useParams();
	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));

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
			padding={{ left: 'large', right: '3.25rem', top: '2.81rem', bottom: '2.06rem' }}
		>
			{ViewToDisplay}
		</Container>
	);
};

export default MeetingViewManager;
