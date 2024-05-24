/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';

const ShimmerEntryMeetingView = (): ReactElement => (
	<Container orientation="horizontal" borderRadius="none">
		<Container
			width="fill"
			borderRadius="none"
			padding={{ all: 'large' }}
			crossAlignment="flex-start"
		/>
	</Container>
);

export default ShimmerEntryMeetingView;
