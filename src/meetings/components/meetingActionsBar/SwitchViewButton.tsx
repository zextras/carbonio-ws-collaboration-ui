/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useContext } from 'react';

import { Button, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getMeetingViewSelected } from '../../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { MeetingViewType } from '../../../types/store/ActiveMeetingTypes';
import { RouterContext } from '../../contexts/routerContext';

const SwitchViewButton = (): ReactElement | null => {
	const { meetingId } = useContext(RouterContext);

	const [t] = useTranslation();
	const gridViewLabel = t('meeting.interactions.gridView', 'Grid view');
	const cinemaViewLabel = t('meeting.interactions.cinemaView', 'Cinema view');

	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId!));
	const setMeetingViewSelected = useStore((store) => store.setMeetingViewSelected);
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId!));

	const switchMode = useCallback(() => {
		setMeetingViewSelected(
			meetingId!,
			meetingViewSelected === MeetingViewType.GRID ? MeetingViewType.CINEMA : MeetingViewType.GRID
		);
	}, [meetingId, meetingViewSelected, setMeetingViewSelected]);

	if (numberOfTiles < 3) return null;
	return (
		<Tooltip
			placement="top"
			label={meetingViewSelected === MeetingViewType.GRID ? cinemaViewLabel : gridViewLabel}
		>
			<Button
				size="large"
				backgroundColor="primary"
				labelColor="gray6"
				icon={meetingViewSelected === MeetingViewType.GRID ? 'CinemaView' : 'Grid'}
				onClick={switchMode}
			/>
		</Tooltip>
	);
};

export default SwitchViewButton;
