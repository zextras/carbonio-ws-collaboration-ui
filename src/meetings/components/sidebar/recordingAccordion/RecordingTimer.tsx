/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Icon } from '@zextras/carbonio-design-system';

type RecordingTimerProps = {
	timestamp: string;
};

const RecordingTimer = ({ timestamp }: RecordingTimerProps): ReactElement => {
	// TODO timer logic
	console.log(timestamp);

	return (
		<Container width="fit">
			<Icon icon="Video" color="error" />
		</Container>
	);
};

export default RecordingTimer;
