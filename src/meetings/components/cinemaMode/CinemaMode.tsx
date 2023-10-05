/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useContainerDimensions from '../../../hooks/useContainerDimensions';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import useTilesOrder from '../../../hooks/useTilesOrder';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import Tile from '../Tile';

const CinemaContainer = styled(Container)`
	min-width: 18.75rem;
`;

const CinemaMode = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const cinemaModeRef = useRef<null | HTMLDivElement>(null);

	const { centralTile } = useTilesOrder(meetingId);
	const cinemaModeDimensions = useContainerDimensions(cinemaModeRef);

	const centralTileWidth = useMemo(() => {
		const tileHeight = (cinemaModeDimensions.width / 16) * 9;
		let tileWidth;
		tileWidth = cinemaModeDimensions.width;
		if (tileHeight >= cinemaModeDimensions.height) {
			tileWidth = (cinemaModeDimensions.height / 9) * 16;
		}
		return `${tileWidth}px`;
	}, [cinemaModeDimensions]);

	return (
		<Container ref={cinemaModeRef}>
			<CinemaContainer data-testid="cinemaModeView" width={centralTileWidth} height="fit">
				<Tile
					userId={centralTile?.userId}
					meetingId={meetingId}
					isScreenShare={centralTile?.type === STREAM_TYPE.SCREEN}
				/>
			</CinemaContainer>
		</Container>
	);
};

export default CinemaMode;
