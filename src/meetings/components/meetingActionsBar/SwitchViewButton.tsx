/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback } from 'react';

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getMeetingViewSelected } from '../../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { MeetingViewType } from '../../../types/store/ActiveMeetingTypes';

const SwitchViewButton = (): ReactElement | null => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	const gridViewLabel = t('meeting.interactions.gridView', 'Grid view');
	const cinemaViewLabel = t('meeting.interactions.cinemaView', 'Cinema view');

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
			label={meetingViewSelected === MeetingViewType.GRID ? cinemaViewLabel : gridViewLabel}
		>
			<IconButton
				size="large"
				backgroundColor="primary"
				iconColor="gray6"
				icon={meetingViewSelected === MeetingViewType.GRID ? 'CinemaView' : 'Grid'}
				onClick={switchMode}
			/>
		</Tooltip>
	);
};

export default SwitchViewButton;
