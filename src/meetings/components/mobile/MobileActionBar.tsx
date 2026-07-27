/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useState
} from 'react';

import { Button, Container } from '@zextras/carbonio-design-system';

import useRouting from '../../../hooks/useRouting';
import { leaveMeeting, updateAudioStreamStatus, updateMediaOffer } from '../../../network';
import {
	getParticipantAudioStatus,
	getParticipantVideoStatus
} from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { getFrontCameraStream } from '../../../utils/UserMediaManager';
import { PAGE_INFO_TYPE } from '../../contexts/routerContext';
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
	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, myUserId));
	const bidirectionalAudioConn = useStore((store) => store.activeMeeting?.bidirectionalAudioConn);
	const videoOutConn = useStore((store) => store.activeMeeting?.videoOutConn);

	const [audioButtonStatus, setAudioButtonStatus] = useState<boolean>(true);
	const [videoButtonStatus, setVideoButtonStatus] = useState<boolean>(true);

	useEffect(() => {
		setAudioButtonStatus(true);
	}, [audioStatus]);

	useEffect(() => {
		setVideoButtonStatus(true);
	}, [videoStatus]);

	const toggleAudioStream = useCallback(async () => {
		setAudioButtonStatus(false);
		try {
			if (!audioStatus) {
				await bidirectionalAudioConn?.unmuteAudioTrack();
				await updateAudioStreamStatus(meetingId, !audioStatus);
			} else {
				bidirectionalAudioConn?.muteAudioTrack();
				await updateAudioStreamStatus(meetingId, !audioStatus);
			}
		} catch {
			// Roll back the local track state to keep it consistent
			// with the server-side status that failed to update
			if (audioStatus) {
				bidirectionalAudioConn?.unmuteAudioTrack().catch(() => undefined);
			} else {
				bidirectionalAudioConn?.muteAudioTrack();
			}
			setAudioButtonStatus(true);
		}
	}, [audioStatus, bidirectionalAudioConn, meetingId]);

	const toggleVideoStream = useCallback(async () => {
		setVideoButtonStatus(false);
		try {
			if (videoStatus) {
				await videoOutConn?.stopVideo();
			} else if (videoOutConn?.peerConn) {
				const stream = await getFrontCameraStream();
				await videoOutConn?.updateLocalStreamTrack(stream);
				await updateMediaOffer(meetingId, STREAM_TYPE.VIDEO, true);
			} else {
				await videoOutConn?.startVideo();
			}
		} catch {
			setVideoButtonStatus(true);
		}
	}, [videoStatus, videoOutConn, meetingId]);

	const leaveMeetingAction = useCallback(
		() => leaveMeeting(meetingId).then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED)),
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
				icon={view === MobileMeetingView.PARTICIPANTS ? 'Video' : 'People'}
				onClick={toggleParticipantView}
			/>
			<Button
				size="large"
				icon={view === MobileMeetingView.CHAT ? 'Video' : 'MessageCircle'}
				onClick={toggleChatView}
			/>
			<Button
				size="large"
				icon={audioStatus ? 'Mic' : 'MicOff'}
				onClick={toggleAudioStream}
				disabled={!audioButtonStatus}
			/>
			<Button
				size="large"
				icon={videoStatus ? 'Video' : 'VideoOff'}
				onClick={toggleVideoStream}
				disabled={!videoButtonStatus}
			/>
			<Button size="large" icon="LogOutOutline" color="error" onClick={leaveMeetingAction} />
		</Container>
	);
};

export default MobileActionBar;
