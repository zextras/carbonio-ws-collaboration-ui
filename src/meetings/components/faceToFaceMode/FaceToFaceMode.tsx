/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useContainerDimensions from '../../../hooks/useContainerDimensions';
import { getCentralTileData } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
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

	const centralTile = useStore((store) => getCentralTileData(store, meetingId));

	const localId = useStore(getUserId);

	const faceToFaceRef = useRef<null | HTMLDivElement>(null);

	const faceToFaceDimensions = useContainerDimensions(faceToFaceRef);

	const centralTileWidth = useMemo(() => {
		const tileHeight = (faceToFaceDimensions.width / 16) * 9;
		let tileWidth;
		tileWidth = faceToFaceDimensions.width;
		if (tileHeight >= faceToFaceDimensions.height) {
			tileWidth = (faceToFaceDimensions.height / 9) * 16;
		}
		return `${tileWidth}px`;
	}, [faceToFaceDimensions]);

	const centralContentToDisplay = useMemo(
		() =>
			centralTile ? (
				<CentralTile width={centralTileWidth} height="fit" background="text">
					<Tile
						userId={centralTile.userId}
						meetingId={meetingId}
						isScreenShare={centralTile.type === STREAM_TYPE.SCREEN}
					/>
				</CentralTile>
			) : (
				<Text color="gray6" size="large">
					{waitingParticipants}
				</Text>
			),
		[centralTile, centralTileWidth, meetingId, waitingParticipants]
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
