/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Icon, Text } from '@zextras/carbonio-design-system';

import useTimer from '../../../../hooks/useTimer';

type RecordingTimerProps = {
	timestamp: string;
};

const RecordingTimer = ({ timestamp }: RecordingTimerProps): ReactElement => {
	const timer = useTimer(timestamp);

	return (
		<Container width="fit" orientation="horizontal" gap="0.5rem">
			<Icon icon="Video" color="error" size="large" />
			<Text>{timer}</Text>
		</Container>
	);
};

export default RecordingTimer;
