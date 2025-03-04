/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback } from 'react';

import { Button, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import {
	getHandRaisedList,
	getUserHasHandRaised
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

const RaiseHandButton = (): ReactElement | null => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const sessionId = useStore(getUserId);

	const handsStatus = useStore((store) => getHandRaisedList(store, meetingId));
	const iHaveHandRaised = useStore((store) =>
		getUserHasHandRaised(store, meetingId, sessionId ?? '')
	);

	const [t] = useTranslation();

	const toggleRaiseHand = useCallback(() => {
		MeetingsApi.raiseHand(meetingId, !iHaveHandRaised);
	}, [iHaveHandRaised, meetingId]);

	return (
		<Tooltip placement="top" label={'raise hand'}>
			<Button
				size="large"
				backgroundColor="primary"
				labelColor="gray6"
				icon={iHaveHandRaised ? 'Smile' : 'SmileOutline'}
				onClick={toggleRaiseHand}
			/>
		</Tooltip>
	);
};

export default RaiseHandButton;
