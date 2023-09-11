/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import {
	getFirstStream,
	getLocalVideoSteam,
	getMeetingSidebarStatus
} from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';

const FaceToFace = styled(Container)`
	position: relative;
`;

const MyStreamContainer = styled(Container)`
	position: absolute;
	top: -2rem;
	right: -3.4rem;
	transition: opacity 200ms linear;
	z-index: 10;
	&:hover {
		opacity: 0;
	}
`;

const TileVideo = styled.video`
	width: 16rem;
	border-radius: 8px;
	background: linear-gradient(180deg, rgba(0, 0, 0, 0) 78.65%, rgba(0, 0, 0, 0.5) 100%),
		lightgray 50% / cover no-repeat;
`;

const CentralTile = styled(Container)`
	border-radius: 8px;
`;

const CentralVideo = styled.video`
	width: 100%;
	border-radius: 8px;
	background: linear-gradient(180deg, rgba(0, 0, 0, 0) 78.65%, rgba(0, 0, 0, 0.5) 100%),
		lightgray 50% / cover no-repeat;
`;

const FaceToFaceMode = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();

	const [t] = useTranslation();
	const waitingParticipants = t(
		'meeting.waitingParticipants',
		'Waiting for participants to join...'
	);

	const localVideoStream = useStore((store) => getLocalVideoSteam(store, meetingId));
	const centralStream = useStore((store) => getFirstStream(store, meetingId));

	const sidebarStatus: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));

	const [centralTileSize, setCentralTileSize] = useState({ tileHeight: '0', tileWidth: '0' });

	const localStreamRef = useRef<null | HTMLVideoElement>(null);
	const centerStreamRef = useRef<null | HTMLVideoElement>(null);
	const faceToFaceRef = useRef<null | HTMLDivElement>(null);

	useEffect(() => {
		if (localStreamRef != null && localStreamRef.current != null && localVideoStream != null) {
			localStreamRef.current.srcObject = localVideoStream;
		}
	}, [localVideoStream]);

	useEffect(() => {
		if (centerStreamRef && centerStreamRef.current && centralStream) {
			centerStreamRef.current.srcObject = centralStream;
		}
	}, [centralStream]);

	const getSizeOfCentralTile = useCallback(() => {
		if (faceToFaceRef && faceToFaceRef.current) {
			let tileHeight;
			let tileWidth;
			tileHeight = (faceToFaceRef.current.offsetWidth / 16) * 9;
			tileWidth = faceToFaceRef.current.offsetWidth;
			if (tileHeight >= faceToFaceRef.current.offsetHeight) {
				tileHeight = faceToFaceRef.current.offsetHeight;
				tileWidth = (faceToFaceRef.current.offsetHeight / 9) * 16;
			}
			setCentralTileSize({ tileHeight: `${tileHeight}px`, tileWidth: `${tileWidth}px` });
		}
	}, []);

	useEffect(() => {
		window.parent.addEventListener('resize', getSizeOfCentralTile);
		return () => window.parent.removeEventListener('resize', getSizeOfCentralTile);
	}, [getSizeOfCentralTile]);

	useEffect(() => getSizeOfCentralTile(), [faceToFaceRef, getSizeOfCentralTile, sidebarStatus]);

	const centralContentToDisplay = useMemo(
		() =>
			centralStream ? (
				<CentralTile
					height={centralTileSize.tileHeight}
					width={centralTileSize.tileWidth}
					background="text"
				>
					<CentralVideo playsInline autoPlay muted controls={false} ref={centerStreamRef} />
				</CentralTile>
			) : (
				<Text color="gray6" size="large">
					{waitingParticipants}
				</Text>
			),
		[centralStream, centralTileSize.tileHeight, centralTileSize.tileWidth, waitingParticipants]
	);

	return (
		<FaceToFace data-testid="faceToFaceModeView" ref={faceToFaceRef}>
			<MyStreamContainer
				data-testid="myStreamContainer"
				height="fit"
				width="fit"
				background="secondary"
				borderRadius="round"
			>
				<TileVideo id="testVideo" playsInline autoPlay muted controls={false} ref={localStreamRef}>
					Your browser does not support the <code>video</code> element.
				</TileVideo>
			</MyStreamContainer>
			{centralContentToDisplay}
		</FaceToFace>
	);
};

export default FaceToFaceMode;
