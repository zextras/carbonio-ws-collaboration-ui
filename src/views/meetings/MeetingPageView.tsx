/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Button, Container, Padding } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';

import useRouting, { PAGE_INFO_TYPE } from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import useStore from '../../store/Store';

const MeetingPageView = (): ReactElement => {
	const { goToInfoPage } = useRouting();
	const { meetingId }: any = useParams();
	const sessionId: string | undefined = useStore((store) => store.session.sessionId);

	const [videoStatus, setVideoStatus] = useState(false);
	const [audioStatus, setAudioStatus] = useState(false);
	const [shareStatus, setShareStatus] = useState(false);

	const leaveMeeting = useCallback(() => {
		MeetingsApi.leaveMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [meetingId, goToInfoPage]);

	const deleteMeeting = useCallback(() => {
		MeetingsApi.deleteMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [meetingId, goToInfoPage]);

	const toggleVideoStream = useCallback(() => {
		if (!videoStatus) {
			MeetingsApi.openVideoStream(meetingId).then(() => setVideoStatus(!videoStatus));
		} else if (sessionId) {
			MeetingsApi.closeVideoStream(meetingId, sessionId).then(() => setVideoStatus(!videoStatus));
		}
	}, [videoStatus, meetingId, sessionId]);

	const toggleAudioStream = useCallback(() => {
		if (!audioStatus) {
			MeetingsApi.openAudioStream(meetingId).then(() => setAudioStatus(!audioStatus));
		} else if (sessionId) {
			MeetingsApi.closeAudioStream(meetingId, sessionId).then(() => setAudioStatus(!audioStatus));
		}
	}, [audioStatus, meetingId, sessionId]);

	const toggleShareStream = useCallback(() => {
		if (!shareStatus) {
			MeetingsApi.openScreenShareStream(meetingId).then(() => setShareStatus(!shareStatus));
		} else if (sessionId) {
			MeetingsApi.closeScreenShareStream(meetingId, sessionId).then(() =>
				setShareStatus(!shareStatus)
			);
		}
	}, [shareStatus, meetingId, sessionId]);

	return (
		<Container>
			<Button label="Leave meeting" onClick={leaveMeeting} color="error" size="large" />
			<Padding />
			<Button label="Delete meeting" onClick={deleteMeeting} color="error" size="large" />
			<Padding />
			<Button
				label={`${!videoStatus ? 'start' : 'close'} video`}
				onClick={toggleVideoStream}
				color="error"
				size="large"
			/>
			<Padding />
			<Button
				label={`${!audioStatus ? 'start' : 'close'} audio`}
				onClick={toggleAudioStream}
				color="error"
				size="large"
			/>
			<Button
				label={`${!shareStatus ? 'start' : 'close'} share`}
				onClick={toggleShareStream}
				color="error"
				size="large"
			/>
			<Padding />
		</Container>
	);
};

export default MeetingPageView;
