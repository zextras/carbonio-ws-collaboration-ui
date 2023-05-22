/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import CinemaMode from './CinemaMode';
import GridMode from './GridMode';
import WaitingForOthersToJoin from './WaitingForOthersToJoin';
import { getMeetingViewSelected } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';
import { MeetingViewType } from '../../types/store/MeetingTypes';

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
				return <WaitingForOthersToJoin />;
		}
	}, [meetingViewSelected]);

	return (
		<Container borderRadius="none" crossAlignment="flex-start">
			{ViewToDisplay}
		</Container>
	);
};

export default MeetingViewManager;
