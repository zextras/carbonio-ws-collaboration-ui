/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';

import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { SimpleTestTile } from '../TestTile';

const CinemaMode = (): ReactElement => {
	// const { meetingId }: { meetingId: string } = useParams();

	// TODO select stream to show
	const centralTileStream: { userId: string; type: STREAM_TYPE } = {
		userId: 'IO',
		type: STREAM_TYPE.VIDEO
	};

	return (
		<Container data-testid="cinemaModeView">
			<SimpleTestTile userId={centralTileStream.userId} />
		</Container>
	);
};

export default CinemaMode;
