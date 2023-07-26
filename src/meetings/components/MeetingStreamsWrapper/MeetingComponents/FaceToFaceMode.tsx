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

import { getMeetingSidebarStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
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
	const [t] = useTranslation();
	const waitingParticipants = t(
		'meeting.waitingParticipants',
		'Waiting for participants to join...'
	);

	const { meetingId }: Record<string, string> = useParams();
	const sidebarStatus: boolean | undefined = useStore((store) =>
		getMeetingSidebarStatus(store, meetingId)
	);

	const [testLocalStream, setTestLocalStream] = useState<null | MediaStream>(null);
	const [centralStream, setCentralStream] = useState<null | MediaStream>(null);
	const [centralTileSize, setCentralTileSize] = useState({ tileHeight: '0', tileWidth: '0' });

	const streamRef = useRef<null | HTMLVideoElement>(null);
	const streamRef2 = useRef<null | HTMLVideoElement>(null);
	const faceToFaceRef = useRef<null | HTMLDivElement>(null);

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

	useEffect(() => getSizeOfCentralTile(), [faceToFaceRef, getSizeOfCentralTile, sidebarStatus]);

	useEffect(() => {
		navigator.mediaDevices
			.getUserMedia({
				// video: { aspectRatio: 1.618 }
				video: { aspectRatio: 1.777 }
			})
			.then((stream: MediaStream) => {
				setTestLocalStream(stream);
				setCentralStream(stream);
				console.debug(stream);
			})
			.catch((err) => {
				console.error('Error while requesting video track', err);
			});
	}, []);

	useEffect(() => {
		if (streamRef != null && streamRef.current != null && testLocalStream != null) {
			streamRef.current.srcObject = testLocalStream;
		}
	}, [testLocalStream]);

	useEffect(() => {
		if (streamRef2 != null && streamRef2.current != null && centralStream != null) {
			streamRef2.current.srcObject = centralStream;
		}
	}, [centralStream]);

	const centralContentToDisplay = useMemo(
		() =>
			centralStream ? (
				<CentralTile
					height={centralTileSize.tileHeight}
					width={centralTileSize.tileWidth}
					background="text"
				>
					<CentralVideo playsInline autoPlay muted controls={false} ref={streamRef2} />
				</CentralTile>
			) : (
				<Text color="gray6" size="large">
					{waitingParticipants}
				</Text>
			),
		[centralStream, centralTileSize.tileHeight, centralTileSize.tileWidth, waitingParticipants]
	);

	return (
		<FaceToFace ref={faceToFaceRef}>
			<MyStreamContainer height="fit" width="fit" background="secondary" borderRadius="round">
				<TileVideo id="testVideo" playsInline autoPlay muted controls={false} ref={streamRef}>
					Your browser does not support the <code>video</code> element.
				</TileVideo>
			</MyStreamContainer>
			{centralContentToDisplay}
		</FaceToFace>
	);
};

export default FaceToFaceMode;
