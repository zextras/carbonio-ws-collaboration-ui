/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect } from 'react';

import { Button, CreateSnackbarFn, Tooltip, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import {
	getUserHasHandRaised,
	getUserIsTalking
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

const RaiseHandButton = (): ReactElement | null => {
	const [t] = useTranslation();

	const handUpTooltip = t('', 'Raise your hand');
	const handDownTooltip = t('', 'Lower your hand');
	const autoDownSnackbar = t(
		'',
		'It sounds like you’re saying something, so your hand will be lowered. '
	);

	const { meetingId }: MeetingRoutesParams = useParams();
	const sessionId = useStore(getUserId);

	const iAmTalking = useStore((store) => getUserIsTalking(store, meetingId ?? '', sessionId ?? ''));
	const iHaveHandRaised = useStore((store) =>
		getUserHasHandRaised(store, meetingId, sessionId ?? '')
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const toggleRaiseHand = useCallback(() => {
		MeetingsApi.raiseHand(meetingId, !iHaveHandRaised);
	}, [iHaveHandRaised, meetingId]);

	const handleAutoHandDown = useCallback(() => {
		setTimeout(() => {
			MeetingsApi.raiseHand(meetingId, false).then(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'info',
					label: autoDownSnackbar,
					hideButton: true,
					autoHideTimeout: 3000
				});
			});
		}, 5000);
	}, [autoDownSnackbar, createSnackbar, meetingId]);

	useEffect(() => {
		if (iHaveHandRaised && iAmTalking) {
			setTimeout(() => {
				if (iAmTalking) {
					handleAutoHandDown();
				}
			}, 2000);
		}
	}, [handleAutoHandDown, iAmTalking, iHaveHandRaised]);

	return (
		<Tooltip placement="top" label={iHaveHandRaised ? handDownTooltip : handUpTooltip}>
			<Button
				size="large"
				backgroundColor="primary"
				labelColor="gray6"
				icon={iHaveHandRaised ? 'Hand' : 'HandOutline'}
				onClick={toggleRaiseHand}
			/>
		</Tooltip>
	);
};

export default RaiseHandButton;
