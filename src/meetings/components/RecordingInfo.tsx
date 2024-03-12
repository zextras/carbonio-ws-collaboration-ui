/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback } from 'react';

import { Container, CreateSnackbarFn, Text, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useEventListener, { EventName } from '../../hooks/useEventListener';
import {
	getIsMeetingRecording,
	getRoomIdByMeetingId
} from '../../store/selectors/MeetingSelectors';
import { getRoomNameSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';

const RecordingContainer = styled(Container)`
	position: absolute;
	top: 0;
	border-radius: 0px 0px 20px 20px;
`;

type RecordingInfoProps = {
	meetingId: string;
};

const RecordingInfo = ({ meetingId }: RecordingInfoProps): ReactElement | null => {
	const roomId = useStore((state) => getRoomIdByMeetingId(state, meetingId));
	const roomName = useStore((state) => getRoomNameSelector(state, roomId || ''));
	const isMeetingRecording = useStore((state) => getIsMeetingRecording(state, meetingId));

	const [t] = useTranslation();
	const meetingIsBeenRecordedLabel = t('meeting.recordingHint', 'This meeting is being recorded');
	const recordingStarted = t(
		'meeting.recordingStart.successSnackbar',
		`The recording of the "${roomName}" meeting has started`,
		{ meetingName: roomName }
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const handleRecordingStarted = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: recordingStarted,
			hideButton: true
		});
	}, [createSnackbar, recordingStarted]);

	useEventListener(EventName.MEETING_RECORDING_STARTED, handleRecordingStarted);

	const handleRecordingStopped = useCallback(
		(event) => {
			if (event.detail.userId !== useStore.getState().session.id) {
				const moderator = useStore.getState().users[event.detail.userId];
				const moderatorName = moderator?.name || moderator?.email || '';
				const recordingStopped = t(
					'meeting.recordingStop.successSnackbar.participants',
					`${moderatorName} stopped the registration of this meeting`,
					{
						userName: moderatorName
					}
				);
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'info',
					label: recordingStopped,
					hideButton: true
				});
			}
		},
		[createSnackbar, t]
	);

	useEventListener(EventName.MEETING_RECORDING_STOPPED, handleRecordingStopped);

	if (!isMeetingRecording) return null;
	return (
		<RecordingContainer
			height="fit"
			width="fit"
			background="error"
			padding={{ horizontal: 'extralarge', vertical: 'extrasmall' }}
		>
			<Text>{meetingIsBeenRecordedLabel}</Text>
		</RecordingContainer>
	);
};

export default RecordingInfo;
