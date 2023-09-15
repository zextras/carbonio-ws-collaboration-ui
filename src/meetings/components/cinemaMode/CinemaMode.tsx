/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useCalculateTilesOrder from '../../../hooks/useCalculateTilesOrder';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getMeetingSidebarStatus } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import Tile from '../Tile';

const CinemaContainer = styled(Container)`
	min-width: 18.75rem;
`;

const CinemaMode = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const { centralTile } = useCalculateTilesOrder(meetingId);

	const sidebarStatus: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));

	const [centralTileSize, setCentralTileSize] = useState({ tileHeight: '0', tileWidth: '0' });

	const cinemaModeRef = useRef<null | HTMLDivElement>(null);

	const getSizeOfCentralTile = useCallback(() => {
		if (cinemaModeRef && cinemaModeRef.current) {
			let tileHeight;
			let tileWidth;
			tileHeight = (cinemaModeRef.current.offsetWidth / 16) * 9;
			tileWidth = cinemaModeRef.current.offsetWidth;
			if (tileHeight >= cinemaModeRef.current.offsetHeight) {
				tileHeight = cinemaModeRef.current.offsetHeight;
				tileWidth = (cinemaModeRef.current.offsetHeight / 9) * 16;
			}
			setCentralTileSize({ tileHeight: `${tileHeight}px`, tileWidth: `${tileWidth}px` });
		}
	}, []);
	useEffect(() => {
		window.parent.addEventListener('resize', getSizeOfCentralTile);
		return () => window.parent.removeEventListener('resize', getSizeOfCentralTile);
	}, [getSizeOfCentralTile]);
	useEffect(() => getSizeOfCentralTile(), [cinemaModeRef, getSizeOfCentralTile, sidebarStatus]);

	return (
		<Container ref={cinemaModeRef}>
			<CinemaContainer data-testid="cinemaModeView" width={centralTileSize.tileWidth} height="fit">
				<Tile userId={centralTile?.userId} meetingId={meetingId} />
			</CinemaContainer>
		</Container>
	);
};

export default CinemaMode;
