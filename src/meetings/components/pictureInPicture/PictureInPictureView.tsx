/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';

import { MeetingRoutesParams } from '../../../hooks/useRouting';
import useTilesOrder from '../../../hooks/useTilesOrder';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import Tile from '../tile/Tile';

const PictureInPictureView = () => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const { centralTile } = useTilesOrder(meetingId);

	return (
		<Container padding="2rem">
			<Tile
				userId={centralTile.userId}
				meetingId={meetingId}
				isScreenShare={centralTile.type === STREAM_TYPE.SCREEN}
			/>
		</Container>
	);
};

export default PictureInPictureView;
