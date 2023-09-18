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
import {
	getMeetingCarouselVisibility,
	getMeetingSidebarStatus
} from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import Tile from '../Tile';

const CinemaContainer = styled(Container)`
	min-width: 18.75rem;
`;

const CinemaMode = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const { centralTile } = useCalculateTilesOrder(meetingId);

	const sidebarStatus: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	const carouselStatus = useStore((store) => getMeetingCarouselVisibility(store, meetingId));

	const [centralTileWidth, setCentralTileWidth] = useState('0');

	const cinemaModeRef = useRef<null | HTMLDivElement>(null);

	const getWidthOfCentralTile = useCallback(() => {
		if (cinemaModeRef && cinemaModeRef.current) {
			const tileHeight = (cinemaModeRef.current.offsetWidth / 16) * 9;
			let tileWidth;
			tileWidth = cinemaModeRef.current.offsetWidth;
			if (tileHeight >= cinemaModeRef.current.offsetHeight) {
				tileWidth = (cinemaModeRef.current.offsetHeight / 9) * 16;
			}
			setCentralTileWidth(`${tileWidth}px`);
		}
	}, []);

	useEffect(() => {
		window.parent.addEventListener('resize', getWidthOfCentralTile);
		return () => window.parent.removeEventListener('resize', getWidthOfCentralTile);
	}, [getWidthOfCentralTile]);

	useEffect(
		() => getWidthOfCentralTile(),
		[cinemaModeRef, getWidthOfCentralTile, sidebarStatus, carouselStatus]
	);

	return (
		<Container ref={cinemaModeRef}>
			<CinemaContainer data-testid="cinemaModeView" width={centralTileWidth} height="fit">
				<Tile userId={centralTile?.userId} meetingId={meetingId} />
			</CinemaContainer>
		</Container>
	);
};

export default CinemaMode;
