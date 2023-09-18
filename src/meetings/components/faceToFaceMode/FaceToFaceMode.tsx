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

import { getMeetingSidebarStatus } from '../../../store/selectors/ActiveMeetingSelectors';
import { getFirstParticipant } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import Tile from '../Tile';

const FaceToFace = styled(Container)`
	position: relative;
`;
const MyStreamContainer = styled(Container)`
	position: absolute;
	top: -2rem;
	right: -3.4rem;
	transition: opacity 200ms linear;
	border-radius: 8px;
	z-index: 10;
	&:hover {
		opacity: 0;
	}
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
`;

const CentralTile = styled(Container)`
	border-radius: 8px;
`;

const FaceToFaceMode = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();

	const [t] = useTranslation();
	const waitingParticipants = t(
		'meeting.waitingParticipants',
		'Waiting for participants to join...'
	);

	const centralParticipant = useStore((store) => getFirstParticipant(store, meetingId));

	const localId = useStore(getUserId);

	const sidebarStatus: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));

	const [centralTileWidth, setCentralTileWidth] = useState('0');

	const faceToFaceRef = useRef<null | HTMLDivElement>(null);

	const getWidthOfCentralTile = useCallback(() => {
		if (faceToFaceRef && faceToFaceRef.current) {
			console.log(faceToFaceRef.current);
			console.log('width', faceToFaceRef.current.offsetWidth);
			const tileHeight = (faceToFaceRef.current.offsetWidth / 16) * 9;
			let tileWidth;
			tileWidth = faceToFaceRef.current.offsetWidth;
			if (tileHeight >= faceToFaceRef.current.offsetHeight) {
				console.log('entro');
				tileWidth = (faceToFaceRef.current.offsetHeight / 9) * 16;
			}
			setCentralTileWidth(`${tileWidth}px`);
		}
	}, []);
	useEffect(() => {
		window.parent.addEventListener('resize', getWidthOfCentralTile);
		return () => window.parent.removeEventListener('resize', getWidthOfCentralTile);
	}, [getWidthOfCentralTile]);
	useEffect(() => getWidthOfCentralTile(), [faceToFaceRef, getWidthOfCentralTile, sidebarStatus]);
	const centralContentToDisplay = useMemo(
		() =>
			centralParticipant ? (
				<CentralTile width={centralTileWidth} height="fit" background="text">
					<Tile userId={centralParticipant.userId} meetingId={meetingId} />
				</CentralTile>
			) : (
				<Text color="gray6" size="large">
					{waitingParticipants}
				</Text>
			),
		[centralParticipant, centralTileWidth, meetingId, waitingParticipants]
	);

	return (
		<FaceToFace data-testid="faceToFaceModeView" ref={faceToFaceRef}>
			<MyStreamContainer
				data-testid="myStreamContainer"
				width="30%"
				height="fit"
				background="secondary"
			>
				<Tile userId={localId} meetingId={meetingId} />
			</MyStreamContainer>
			{centralContentToDisplay}
		</FaceToFace>
	);
};
export default FaceToFaceMode;
