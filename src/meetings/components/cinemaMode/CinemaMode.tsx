/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import { useParams } from 'react-router-dom';

import useCalculateTilesOrder from '../../../hooks/useCalculateTilesOrder';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { SimpleTestTile } from '../TestTile';

const CinemaMode = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const { centralTile } = useCalculateTilesOrder(meetingId);

	return (
		<Container data-testid="cinemaModeView">
			<SimpleTestTile userId={centralTile.userId} />
		</Container>
	);
};

export default CinemaMode;
