/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useCentralTileDimensions from '../../../hooks/useCentralTileDimensions';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { SimpleTestTile } from '../TestTile';

const MainStreamWrapper = styled(Container)`
	border-radius: 0.5rem;
`;

const CinemaMode = (): ReactElement => {
	const { meetingId }: { meetingId: string } = useParams();

	// TODO select stream to show
	const centralTileStream: { userId: string; type: STREAM_TYPE } = {
		userId: 'IO',
		type: STREAM_TYPE.VIDEO
	};

	const mainTileRef = useRef<HTMLDivElement>(null);

	const mainTileDimensions = useCentralTileDimensions(meetingId, mainTileRef);

	useEffect(() => {
		console.log('mainTile:', mainTileDimensions.width, mainTileDimensions.height);
	}, [mainTileDimensions]);

	return (
		<Container data-testid="cinemaModeView" orientation="horizontal">
			<Container ref={mainTileRef}>
				<MainStreamWrapper height={mainTileDimensions.height} width={mainTileDimensions.width}>
					<SimpleTestTile userId={centralTileStream.userId} />
				</MainStreamWrapper>
			</Container>
		</Container>
	);
};

export default CinemaMode;
