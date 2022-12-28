/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Modal, Switch } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback, useState } from 'react';

import useRouting from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import { getMeeting } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';
import { JoinMeetingResponse } from '../../types/network/responses/meetingsResponses';

type AccessMeetingModalProps = {
	roomId: string;
};

const AccessMeetingModal = ({ roomId }: AccessMeetingModalProps): ReactElement => {
	const session = useStore((store) => store.session);
	const meeting = useStore((store) => getMeeting(store, roomId));
	const addMeeting = useStore((store) => store.addMeeting);
	const addParticipant = useStore((store) => store.addParticipant);
	const [cameraOn, setCameraOn] = useState(false);
	const [microphoneOn, setMicrophoneOn] = useState(false);

	const onSwitchCamera = useCallback(() => setCameraOn((c) => !c), []);
	const onSwitchMicrophone = useCallback(() => setMicrophoneOn((c) => !c), []);

	const { goToMeetingPage } = useRouting();

	const joinMeeting = useCallback(() => {
		// Meeting already exists: user joins it
		if (meeting) {
			MeetingsApi.joinMeetingByMeetingId(meeting.id, { cameraOn, microphoneOn })
				.then(() => {
					addParticipant(meeting.id, {
						userId: session.id!,
						sessionId: session.sessionId!,
						hasCameraOn: cameraOn,
						hasMicrophoneOn: microphoneOn
					});
					goToMeetingPage(meeting.id);
				})
				.catch(() => console.log('Error on join'));
		}
		// Meeting doesn't exist: user creates and joins it
		else {
			MeetingsApi.joinMeeting(roomId, { cameraOn, microphoneOn })
				.then((response: JoinMeetingResponse) => {
					addMeeting(response);
					goToMeetingPage(response.id);
				})
				.catch(() => console.log('Error on join'));
		}
	}, [
		meeting,
		cameraOn,
		microphoneOn,
		addParticipant,
		session.id,
		session.sessionId,
		goToMeetingPage,
		roomId,
		addMeeting
	]);

	return (
		<Modal
			size="small"
			open={true}
			title={'How do you want to enter the meeting?'}
			confirmLabel={'Enter'}
			onConfirm={joinMeeting}
		>
			<Switch label="Camera" value={cameraOn} onClick={onSwitchCamera} />
			<Switch label="Microphone" value={microphoneOn} onClick={onSwitchMicrophone} />
		</Modal>
	);
};

export default AccessMeetingModal;
