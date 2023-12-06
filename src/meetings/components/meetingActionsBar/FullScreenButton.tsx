/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect, useState } from 'react';

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

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

	const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);

	const checkFullScreenStatus = (): void =>
		window.parent.document.fullscreenElement /* || window.parent.document.webkitFullscreenElement */
			? setIsFullScreenEnabled(true)
			: setIsFullScreenEnabled(false);

	const checkKeyPress = useCallback(
		(e: KeyboardEvent): void => {
			if (e.key === 'F11') {
				e.preventDefault();
				if (!isFullScreenEnabled && !window.parent.document.fullscreenElement) {
					window.parent.document.documentElement.requestFullscreen();
				} else if (window.parent.document.exitFullscreen) {
					window.parent.document.exitFullscreen();
				}
			}
		},
		[isFullScreenEnabled]
	);

	const toggleFullScreen = useCallback((): void => {
		if (sidebarIsVisible && !isFullScreenEnabled) {
			setMeetingSidebarStatus(meetingId, false);
		}
		!window.parent.document.fullscreenElement
			? window.parent.document.documentElement.requestFullscreen()
			: window.parent.document.exitFullscreen();
	}, [sidebarIsVisible, isFullScreenEnabled, setMeetingSidebarStatus, meetingId]);

	useEffect(() => {
		window.parent.addEventListener('keydown', checkKeyPress, true);
		window.parent.document.onfullscreenchange = checkFullScreenStatus;
		return window.parent.removeEventListener('keydown', checkKeyPress);
	}, [checkKeyPress]);

	return (
		<Tooltip
			placement="top"
			label={isFullScreenEnabled ? disableFullScreenLabel : enableFullScreenLabel}
		>
			<IconButton
				data-testid="fullscreen-button"
				iconColor="gray6"
				backgroundColor="primary"
				icon={isFullScreenEnabled ? 'Collapse' : 'Expand'}
				onClick={toggleFullScreen}
				size="large"
			/>
		</Tooltip>
	);
};

export default FullScreenButton;
