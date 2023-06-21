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
	const [videoStreamEnabled, setVideoStreamEnabled] = useState(false);
	const [audioStreamEnabled, setAudioStreamEnabled] = useState(false);

	const onSwitchCamera = useCallback(() => setVideoStreamEnabled((c) => !c), []);
	const onSwitchMicrophone = useCallback(() => setAudioStreamEnabled((c) => !c), []);

	const { goToMeetingPage } = useRouting();

	const joinMeeting = useCallback(() => {
		// Meeting already exists: user joins it
		if (meeting) {
			MeetingsApi.joinMeetingByMeetingId(meeting.id, { videoStreamEnabled, audioStreamEnabled })
				.then(() => {
					addParticipant(meeting.id, {
						userId: session.id!,
						sessionId: session.sessionId!,
						videoStreamOn: videoStreamEnabled,
						audioStreamOn: audioStreamEnabled
					});
					goToMeetingPage(meeting.id);
				})
				.catch(() => console.log('Error on join'));
		}
		// Meeting doesn't exist: user creates and joins it
		else {
			MeetingsApi.joinMeeting(roomId, { videoStreamEnabled, audioStreamEnabled })
				.then((response: JoinMeetingResponse) => {
					addMeeting(response);
					goToMeetingPage(response.id);
				})
				.catch(() => console.log('Error on join'));
		}
	}, [
		meeting,
		videoStreamEnabled,
		audioStreamEnabled,
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
			open
			title={'How do you want to enter the components?'}
			confirmLabel={'Enter'}
			onConfirm={joinMeeting}
		>
			<Switch label="Camera" value={videoStreamEnabled} onClick={onSwitchCamera} />
			<Switch label="Microphone" value={audioStreamEnabled} onClick={onSwitchMicrophone} />
		</Modal>
	);
};

export default AccessMeetingModal;
