/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import ShimmerMeetingStreamsWrapper from './ShimmerMeetingStreamsWrapper';

const ShimmerEntryMeetingView = (): ReactElement => (
	<Container orientation="horizontal" borderRadius="none">
		<ShimmerMeetingStreamsWrapper />
	</Container>
);

export default ShimmerEntryMeetingView;
