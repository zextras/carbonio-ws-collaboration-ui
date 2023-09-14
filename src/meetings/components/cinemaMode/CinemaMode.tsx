/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useCalculateTilesOrder from '../../../hooks/useCalculateTilesOrder';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { SimpleTestTile } from '../TestTile';

const CinemaContainer = styled(Container)`
	min-width: 18.75rem;
`;

const CinemaMode = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const { centralTile } = useCalculateTilesOrder(meetingId);

	return (
		<CinemaContainer data-testid="cinemaModeView">
			<SimpleTestTile userId={centralTile?.userId} />
		</CinemaContainer>
	);
};

export default CinemaMode;
