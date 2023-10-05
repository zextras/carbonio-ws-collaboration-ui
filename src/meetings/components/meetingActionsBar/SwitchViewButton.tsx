/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { getMeetingViewSelected } from '../../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { MeetingViewType } from '../../../types/store/ActiveMeetingTypes';

const SwitchViewButton = (): ReactElement | null => {
	const { meetingId }: Record<string, string> = useParams();

	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const setMeetingViewSelected = useStore((store) => store.setMeetingViewSelected);
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId));

	const switchMode = useCallback(() => {
		setMeetingViewSelected(
			meetingId,
			meetingViewSelected === MeetingViewType.GRID ? MeetingViewType.CINEMA : MeetingViewType.GRID
		);
	}, [meetingId, meetingViewSelected, setMeetingViewSelected]);

	if (numberOfTiles < 3) return null;
	return (
		<Tooltip
			placement="top"
			label={meetingViewSelected === MeetingViewType.GRID ? 'Go to cinema View' : 'Go to grid view'} // TODO
		>
			<IconButton
				size="large"
				backgroundColor="primary"
				iconColor="gray6"
				icon={meetingViewSelected === MeetingViewType.GRID ? 'Grid' : 'CinemaView'}
				onClick={switchMode}
			/>
		</Tooltip>
	);
};

export default SwitchViewButton;
