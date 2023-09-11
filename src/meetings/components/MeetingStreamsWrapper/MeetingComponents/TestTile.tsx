/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement, useEffect, useRef } from 'react';
import styled from 'styled-components';

import { getStream } from '../../../../store/selectors/ActiveMeetingSelectors';
import {
	getParticipantAudioStatus,
	getParticipantVideoStatus
} from '../../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { STREAM_TYPE } from '../../../../types/store/ActiveMeetingTypes';

const TestTileContainer = styled(Container)`
	height: 200px;
	width: 300px;
`;
const Video = styled.video`
	height: 120px;
	border-radius: 8px;
	background: black;
`;

const TestTile = ({ meetingId, userId }: { meetingId: string; userId: string }): ReactElement => {
	const isSessionTile = useStore(getUserId) === userId;
	const username = useStore((store) => getUserName(store, userId));
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, userId));
	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, userId));
	const videoStream = useStore((store) => getStream(store, meetingId, userId, STREAM_TYPE.VIDEO));

	const streamRef = useRef<null | HTMLVideoElement>(null);

	useEffect(() => {
		if (streamRef && streamRef.current) {
			if (videoStream && videoStatus) {
				streamRef.current.srcObject = videoStream;
			} else {
				streamRef.current.srcObject = null;
			}
		}
	}, [videoStatus, videoStream]);

	return (
		<TestTileContainer>
			{isSessionTile && <Text>MIO STREAM</Text>}
			<Text>{username}</Text>
			<Text>
				VIDEO: {videoStatus.toString()} - AUDIO: {audioStatus.toString()}
			</Text>
			<Video playsInline autoPlay muted controls={false} ref={streamRef} />
		</TestTileContainer>
	);
};

export default TestTile;
