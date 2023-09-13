/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useCentralTileDimensions from '../../../hooks/useCentralTileDimensions';
import {
	getFirstStream,
	getLocalVideoSteam
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getFirstParticipant } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';

const FaceToFace = styled(Container)`
	position: relative;
`;

const MyStreamContainer = styled(Container)`
	position: absolute;
	top: -2rem;
	right: -3.4rem;
	transition: opacity 200ms linear;
	z-index: 10;
	width: 16rem;
	height: 9rem;
	border-radius: 0.5rem;
	&:hover {
		opacity: 0;
	}
`;

const TileVideo = styled.video`
	width: 16rem;
	height: 9rem;
	border-radius: 0.5rem;
	background: ${({ theme }): string => theme.palette.text};
`;

const CentralTile = styled(Container)`
	border-radius: 8px;
`;

const CentralVideo = styled.video`
	width: 100%;
	border-radius: 8px;
	background: ${({ theme }): string => theme.palette.text};
`;

const FaceToFaceMode = (): ReactElement => {
	const { meetingId }: { meetingId: string } = useParams();

	const [t] = useTranslation();
	const waitingParticipants = t(
		'meeting.waitingParticipants',
		'Waiting for participants to join...'
	);

	const centralParticipant = useStore((store) => getFirstParticipant(store, meetingId));

	const localVideoStream = useStore((store) => getLocalVideoSteam(store, meetingId));
	const centralStream = useStore((store) => getFirstStream(store, meetingId));

	const localStreamRef = useRef<HTMLVideoElement>(null);
	const centerStreamRef = useRef<HTMLVideoElement>(null);
	const faceToFaceRef = useRef<HTMLDivElement>(null);

	const centralTileDimensions = useCentralTileDimensions(meetingId, faceToFaceRef);

	useEffect(() => {
		if (localStreamRef != null && localStreamRef.current != null) {
			if (localVideoStream) {
				localStreamRef.current.srcObject = localVideoStream;
			} else {
				localStreamRef.current.srcObject = null;
			}
		}
	}, [localVideoStream]);

	useEffect(() => {
		if (centerStreamRef && centerStreamRef.current) {
			if (centralStream) {
				centerStreamRef.current.srcObject = centralStream;
			} else {
				centerStreamRef.current.srcObject = null;
			}
		}
	}, [centralStream]);

	const centralContentToDisplay = useMemo(
		() =>
			centralParticipant ? (
				<CentralTile
					height={centralTileDimensions.height}
					width={centralTileDimensions.width}
					background="text"
				>
					<CentralVideo
						height={centralTileDimensions.height}
						width={centralTileDimensions.width}
						playsInline
						autoPlay
						muted
						controls={false}
						ref={centerStreamRef}
					/>
				</CentralTile>
			) : (
				<Text color="gray6" size="large">
					{waitingParticipants}
				</Text>
			),
		[centralParticipant, centralTileDimensions, waitingParticipants]
	);

	return (
		<FaceToFace data-testid="faceToFaceModeView" ref={faceToFaceRef}>
			<MyStreamContainer data-testid="myStreamContainer" height="fit" width="fit" background="text">
				<TileVideo id="testVideo" playsInline autoPlay muted controls={false} ref={localStreamRef}>
					Your browser does not support the <code>video</code> element.
				</TileVideo>
			</MyStreamContainer>
			{centralContentToDisplay}
		</FaceToFace>
	);
};

export default FaceToFaceMode;
