/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useContext, useEffect, useRef } from 'react';

import { Button, CreateSnackbarFn, Tooltip, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MeetingsApi } from '../../../network';
import {
	getUserHasHandRaised,
	getUserIsTalking
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { RouterContext } from '../../contexts/routerContext';

const RaiseHandButton = (): ReactElement | null => {
	const [t] = useTranslation();

	const handUpTooltip = t('meeting.interactions.handUp', 'Raise your hand');
	const handDownTooltip = t('meeting.interactions.handDown', 'Lower your hand');
	const autoDownSnackbar = t(
		'meeting.snackbar.autoHandDown',
		'It sounds like you’re saying something, so your hand will be lowered. '
	);

	const { meetingId } = useContext(RouterContext);
	const sessionId = useStore(getUserId);

	const iAmTalking = useStore((store) => getUserIsTalking(store, sessionId ?? ''));
	const iHaveHandRaised = useStore((store) => getUserHasHandRaised(store, sessionId ?? ''));

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const toggleRaiseHand = useCallback(() => {
		MeetingsApi.raiseHand(meetingId!, !iHaveHandRaised);
	}, [iHaveHandRaised, meetingId]);

	const handleAutoHandDown = useCallback(() => {
		setTimeout(() => {
			MeetingsApi.raiseHand(meetingId!, false).then(() => {
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

	const refTimeout = useRef<NodeJS.Timeout>();

	useEffect(() => {
		if (iHaveHandRaised && iAmTalking) {
			refTimeout.current = setTimeout(() => {
				if (iAmTalking) {
					handleAutoHandDown();
				}
			}, 2000);
		}
		if (refTimeout.current !== undefined && !iAmTalking) {
			clearTimeout(refTimeout.current);
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
