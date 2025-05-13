/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useContext, useEffect, useMemo } from 'react';

import { Button, Dropdown, DropdownItem, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useFullScreen from '../../../hooks/useFullScreen';
import usePiPWindow from '../../../hooks/usePipWindow';
import { getMeetingViewSelected } from '../../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { MeetingAccordionType, MeetingViewType } from '../../../types/store/ActiveMeetingTypes';
import { RouterContext } from '../../contexts/routerContext';

const MoreActionsButton = (): ReactElement => {
	const { meetingId } = useContext(RouterContext);

	const [t] = useTranslation();
	const moreActionsLabel = t('tooltip.moreActions', 'More actions');
	const enablePip = t('meeting.pip.trigger', 'Enable PiP');
	const disablePip = t('meeting.pip.close', 'Disable PiP');
	const gridViewLabel = t('meeting.interactions.gridView', 'Grid view');
	const cinemaViewLabel = t('meeting.interactions.cinemaView', 'Cinema view');
	const disableFullScreenLabel = t('meeting.interactions.disableFullScreen', 'Disable full screen');
	const enableFullScreenLabel = t('meeting.interactions.enableFullScreen', 'Enable full screen');

	const meetingView = useStore(getMeetingViewSelected);
	const setMeetingSidebarStatus = useStore((store) => store.setMeetingSidebarStatus);
	const meetingViewSelected = useStore(getMeetingViewSelected);
	const setMeetingViewSelected = useStore((store) => store.setMeetingViewSelected);
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId!));
	const setIsCarouselVisible = useStore((store) => store.setIsCarouseVisible);

	const { isSupported, requestPipWindow, pipWindow, closePipWindow } = usePiPWindow();
	const { isFullScreen, toggleFullScreen } = useFullScreen();

	const togglePip = useCallback(() => {
		if (isSupported && pipWindow == null) {
			requestPipWindow(320, 331);
		} else if (pipWindow != null) {
			closePipWindow();
		}
	}, [closePipWindow, isSupported, pipWindow, requestPipWindow]);

	const switchMode = useCallback(() => {
		setMeetingViewSelected(
			meetingViewSelected === MeetingViewType.GRID ? MeetingViewType.CINEMA : MeetingViewType.GRID
		);
	}, [meetingViewSelected, setMeetingViewSelected]);

	const checkKeyPress = useCallback(
		(e: KeyboardEvent): void => {
			if (e.key === 'F11') {
				e.preventDefault();
				toggleFullScreen();
			}
		},
		[toggleFullScreen]
	);

	const toggleFullScreenFn = useCallback((): void => {
		if (!isFullScreen) {
			setMeetingSidebarStatus(MeetingAccordionType.GENERAL, false);
			if (meetingView === MeetingViewType.CINEMA) {
				setIsCarouselVisible(false);
			}
		}
		toggleFullScreen();
	}, [isFullScreen, toggleFullScreen, setMeetingSidebarStatus, meetingView, setIsCarouselVisible]);

	useEffect(() => {
		window.addEventListener('keydown', checkKeyPress, true);
		return (): void => {
			window.removeEventListener('keydown', checkKeyPress);
		};
	}, [checkKeyPress]);

	const items: DropdownItem[] = useMemo(() => {
		const list = [];
		if (isSupported) {
			list.push({
				id: 'item1',
				icon: pipWindow != null ? 'CloseSquareOutline' : 'ExternalLinkOutline',
				label: pipWindow != null ? disablePip : enablePip,
				keepOpen: false,
				onClick: togglePip
			});
		}
		if (numberOfTiles >= 3) {
			list.push({
				id: 'item2',
				icon: meetingViewSelected === MeetingViewType.GRID ? 'CinemaView' : 'Grid',
				label: meetingViewSelected === MeetingViewType.GRID ? cinemaViewLabel : gridViewLabel,
				keepOpen: false,
				onClick: switchMode
			});
		}
		list.push({
			id: 'item3',
			icon: isFullScreen ? 'Collapse' : 'Expand',
			label: isFullScreen ? disableFullScreenLabel : enableFullScreenLabel,
			keepOpen: false,
			onClick: toggleFullScreenFn
		});
		return list;
	}, [
		cinemaViewLabel,
		disableFullScreenLabel,
		disablePip,
		enableFullScreenLabel,
		enablePip,
		gridViewLabel,
		isFullScreen,
		isSupported,
		meetingViewSelected,
		numberOfTiles,
		pipWindow,
		switchMode,
		toggleFullScreenFn,
		togglePip
	]);

	return (
		<Tooltip label={moreActionsLabel} placement="top">
			<Dropdown items={items} placement="top-start">
				<Button
					icon="MoreVertical"
					color="primary"
					size="large"
					onClick={(): null => null}
					data-testid="more-actions"
				/>
			</Dropdown>
		</Tooltip>
	);
};

export default MoreActionsButton;
