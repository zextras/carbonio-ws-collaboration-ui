/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Dispatch, ReactElement, SetStateAction, useCallback } from 'react';

import { Button, Container } from '@zextras/carbonio-design-system';

import useRouting, { PAGE_INFO_TYPE } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import { getParticipantAudioStatus } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { getAudioStream } from '../../../utils/UserMediaManager';
import { MobileMeetingView } from '../../views/mobile/MeetingSkeletonMobile';

type MobileActionBarProps = {
	meetingId: string;
	view: MobileMeetingView;
	setView: Dispatch<SetStateAction<MobileMeetingView>>;
};

const MobileActionBar = ({ meetingId, view, setView }: MobileActionBarProps): ReactElement => {
	const { goToInfoPage } = useRouting();

	const myUserId = useStore(getUserId);
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, myUserId));
	const bidirectionalAudioConn = useStore(
		(store) => store.activeMeeting[meetingId]?.bidirectionalAudioConn
	);

	const toggleAudioStream = useCallback(() => {
		if (!audioStatus) {
			getAudioStream(true, true).then((stream) => {
				bidirectionalAudioConn?.updateLocalStreamTrack(stream).then(() => {
					MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus);
				});
			});
		} else {
			bidirectionalAudioConn?.closeRtpSenderTrack();
			MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus);
		}
	}, [audioStatus, bidirectionalAudioConn, meetingId]);

	const leaveMeeting = useCallback(
		() =>
			MeetingsApi.leaveMeeting(meetingId).then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED)),
		[meetingId, goToInfoPage]
	);

	const toggleParticipantView = useCallback(() => {
		const newView =
			view === MobileMeetingView.PARTICIPANTS
				? MobileMeetingView.TILES
				: MobileMeetingView.PARTICIPANTS;
		setView(newView);
	}, [view, setView]);

	const toggleChatView = useCallback(() => {
		const newView =
			view === MobileMeetingView.CHAT ? MobileMeetingView.TILES : MobileMeetingView.CHAT;
		setView(newView);
	}, [view, setView]);

	return (
		<Container height="fit" orientation="horizontal" padding="1rem" gap="1rem">
			<Button
				size="large"
				icon="PeopleOutline"
				onClick={toggleParticipantView}
				backgroundColor={view === MobileMeetingView.PARTICIPANTS ? 'success' : 'primary'}
			/>
			<Button
				size="large"
				icon="MessageCircle"
				onClick={toggleChatView}
				backgroundColor={view === MobileMeetingView.CHAT ? 'success' : 'primary'}
			/>
			<Button size="large" icon={audioStatus ? 'Mic' : 'MicOff'} onClick={toggleAudioStream} />
			<Button size="large" icon="LogOutOutline" color="error" onClick={leaveMeeting} />
		</Container>
	);
};

export default MobileActionBar;
