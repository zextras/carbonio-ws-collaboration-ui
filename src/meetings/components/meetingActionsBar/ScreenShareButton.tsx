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
import { getParticipantScreenStatus } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

const ScreenShareButton = (): ReactElement => {
	const [t] = useTranslation();

	const disableScreenLabel = t('meeting.interactions.disableScreen', 'Disable screen share');
	const enableScreenLabel = t('meeting.interactions.enableScreen', 'Enable screen share');

	const { meetingId }: MeetingRoutesParams = useParams();

	const myUserId = useStore(getUserId);
	const screenStatus = useStore((store) => getParticipantScreenStatus(store, meetingId, myUserId));
	const screenOutConn = useStore((store) => store.activeMeeting[meetingId]?.screenOutConn);

	const toggleScreenStream = useCallback(() => {
		if (!screenStatus) {
			screenOutConn?.startScreenShare();
		} else {
			screenOutConn?.stopScreenShare();
		}
	}, [screenOutConn, screenStatus]);

	return (
		<Tooltip placement="top" label={screenStatus ? disableScreenLabel : enableScreenLabel}>
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={screenStatus ? 'ScreenSharingOn' : 'ScreenSharingOff'}
				onClick={toggleScreenStream}
				size="large"
			/>
		</Tooltip>
	);
};

export default ScreenShareButton;
