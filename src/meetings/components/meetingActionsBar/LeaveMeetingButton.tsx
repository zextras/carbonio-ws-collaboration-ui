/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback } from 'react';

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import useRouting, { MeetingRoutesParams, PAGE_INFO_TYPE } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';

const LeaveMeetingButton = (): ReactElement => {
	const [t] = useTranslation();

	const leaveMeetingLabel = t('meeting.interactions.leaveMeeting', 'Leave Meeting');

	const { goToInfoPage } = useRouting();
	const { meetingId }: MeetingRoutesParams = useParams();

	const leaveMeeting = useCallback(() => {
		MeetingsApi.leaveMeeting(meetingId).then(() => {
			if (window.parent.document.fullscreenElement) {
				window.parent.document.exitFullscreen();
			}
			goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
		});
	}, [meetingId, goToInfoPage]);

	return (
		<Tooltip placement="top" label={leaveMeetingLabel}>
			<IconButton
				iconColor="gray6"
				backgroundColor="error"
				icon="Hangup"
				onClick={leaveMeeting}
				size="large"
			/>
		</Tooltip>
	);
};

export default LeaveMeetingButton;
