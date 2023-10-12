/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';

const ShimmerMeetingStreamsWrapper = (): ReactElement => (
	<Container
		background="gray0"
		width="fill"
		borderRadius="none"
		padding={{ all: 'large' }}
		crossAlignment="flex-start"
	/>
);

export default ShimmerMeetingStreamsWrapper;
