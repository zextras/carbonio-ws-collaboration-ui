/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Modal, Switch } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback, useState } from 'react';

import useRouting from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import { PeerConnConfig } from '../../network/webRTC/PeerConnConfig';
import { getMeeting } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';

type AccessMeetingModalProps = {
	roomId: string;
};

const AccessMeetingModal = ({ roomId }: AccessMeetingModalProps): ReactElement => {
	const meeting = useStore((store) => getMeeting(store, roomId));
	const addMeeting = useStore((store) => store.addMeeting);
	const createBidirectionalAudioConn = useStore((store) => store.createBidirectionalAudioConn);
	const createVideoOutConn = useStore((store) => store.createVideoOutConn);
	// const createVideoInConn = useStore((store) => store.createVideoInConn);

	const [videoStreamEnabled, setVideoStreamEnabled] = useState(false);
	const [audioStreamEnabled, setAudioStreamEnabled] = useState(false);

	const onSwitchCamera = useCallback(() => setVideoStreamEnabled((c) => !c), []);
	const onSwitchMicrophone = useCallback(() => setAudioStreamEnabled((c) => !c), []);

	const { goToMeetingPage } = useRouting();

	const redirectToMeetingAndInitWebRTC = useCallback(
		(meetingId: string): void => {
			const peerConnectionConfig = new PeerConnConfig();
			createBidirectionalAudioConn(meetingId, audioStreamEnabled, peerConnectionConfig);
			// createVideoInConn(meetingId, peerConnectionConfig);
			if (videoStreamEnabled) {
				createVideoOutConn(meetingId, peerConnectionConfig);
			}
			goToMeetingPage(meetingId);
		},
		[
			createBidirectionalAudioConn,
			createVideoOutConn,
			goToMeetingPage,
			videoStreamEnabled,
			audioStreamEnabled
		]
	);

	const joinMeeting = useCallback(() => {
		const join = (meetingId: string): Promise<void> =>
			MeetingsApi.joinMeeting(meetingId, { videoStreamEnabled, audioStreamEnabled })
				.then(() => {
					redirectToMeetingAndInitWebRTC(meetingId);
				})
				.catch((err) => console.error(err, 'Error on joinMeeting'));
		const start = (meetingId: string): Promise<void> =>
			MeetingsApi.startMeeting(meetingId)
				.then(() => {
					join(meetingId);
				})
				.catch((err) => console.error(err, 'Error on startMeeting'));

		if (meeting) {
			if (meeting.active) {
				// If meeting is already active, just join it
				join(meeting.id);
			} else {
				// If meeting is not active, start it and then join it
				start(meeting.id);
			}
		} else {
			// If meeting doesn't exist, create it, start it and then join it
			MeetingsApi.createPermanentMeeting(roomId)
				.then((response) => {
					addMeeting(response);
					start(response.id);
				})
				.catch((err) => console.log(err, 'Error on create-join'));
		}
	}, [
		meeting,
		videoStreamEnabled,
		audioStreamEnabled,
		redirectToMeetingAndInitWebRTC,
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
