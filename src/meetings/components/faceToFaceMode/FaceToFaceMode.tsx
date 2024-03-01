/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useEffect, useMemo, useRef } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useContainerDimensions from '../../../hooks/useContainerDimensions';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getVideoScreenIn } from '../../../store/selectors/ActiveMeetingSelectors';
import { getCentralTileData } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE, Subscription } from '../../../types/store/ActiveMeetingTypes';
import { calcScaleDivisor } from '../../../utils/styleUtils';
import { MeetingViewProps } from '../../views/MeetingSkeleton';
import Tile from '../tile/Tile';

const FaceToFace = styled(Container)`
	position: relative;
	padding: 3.25rem;
`;

const MyStreamContainer = styled(Container)`
	position: absolute;
	top: 1rem;
	right: 1rem;
	transition: opacity 200ms linear;
	border-radius: 0.5rem;
	z-index: 10;
	&:hover {
		opacity: 0;
	}
	box-shadow: 0 0 0.625rem rgba(0, 0, 0, 0.3);
`;

const CentralTile = styled(Container)`
	border-radius: 0.5rem;
`;

const FaceToFaceMode = ({ children }: MeetingViewProps): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	const waitingParticipants = t(
		'meeting.waitingParticipants',
		'Waiting for participants to join...'
	);

	const centralTile = useStore((store) => getCentralTileData(store, meetingId));

	const localId = useStore(getUserId);
	const videoScreenIn = useStore((store) => getVideoScreenIn(store, meetingId));
	const setUpdateSubscription = useStore((store) => store.setUpdateSubscription);

	const faceToFaceRef = useRef<null | HTMLDivElement>(null);

	const faceToFaceDimensions = useContainerDimensions(faceToFaceRef);

	useEffect(() => {
		if (centralTile) {
			const subscription: Subscription = { userId: centralTile.userId, type: centralTile.type };
			setUpdateSubscription(meetingId, [subscription]);
		}
	}, [centralTile, meetingId, setUpdateSubscription, videoScreenIn]);

	const centralTileWidth = useMemo(() => {
		const tileHeight = (faceToFaceDimensions.width / 16) * 9;
		let tileWidth;
		tileWidth = faceToFaceDimensions.width;
		if (tileHeight >= faceToFaceDimensions.height) {
			tileWidth = (faceToFaceDimensions.height / 9) * 16;
		}
		return `${tileWidth / calcScaleDivisor()}rem`;
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
				maxWidth="25rem"
				height="fit"
				background="secondary"
			>
				<Tile userId={localId} meetingId={meetingId} />
			</MyStreamContainer>
			{centralContentToDisplay}
			{children}
		</FaceToFace>
	);
};
export default FaceToFaceMode;
