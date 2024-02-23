/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect } from 'react';

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import useFullScreen from '../../../hooks/useFullScreen';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getMeetingSidebarStatus } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';

const FullScreenButton = (): ReactElement => {
	const [t] = useTranslation();

	const disableFullScreenLabel = t('meeting.interactions.disableFullScreen', 'Disable full screen');
	const enableFullScreenLabel = t('meeting.interactions.enableFullScreen', 'Enable full screen');

	const { meetingId }: MeetingRoutesParams = useParams();

	const sidebarIsVisible: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	const setMeetingSidebarStatus = useStore((store) => store.setMeetingSidebarStatus);

	const { isFullScreen, toggleFullScreen } = useFullScreen();

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
		if (sidebarIsVisible && !isFullScreen) {
			setMeetingSidebarStatus(meetingId, false);
		}
		toggleFullScreen();
	}, [sidebarIsVisible, isFullScreen, toggleFullScreen, setMeetingSidebarStatus, meetingId]);

	useEffect(() => {
		window.addEventListener('keydown', checkKeyPress, true);
		return () => {
			window.removeEventListener('keydown', checkKeyPress);
		};
	}, [checkKeyPress]);

	return (
		<Tooltip placement="top" label={isFullScreen ? disableFullScreenLabel : enableFullScreenLabel}>
			<IconButton
				data-testid={isFullScreen ? 'exit-fullscreen-button' : 'fullscreen-button'}
				iconColor="gray6"
				backgroundColor="primary"
				icon={isFullScreen ? 'Collapse' : 'Expand'}
				onClick={toggleFullScreenFn}
				size="large"
			/>
		</Tooltip>
	);
};

export default FullScreenButton;
