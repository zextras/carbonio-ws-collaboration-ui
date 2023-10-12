/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import ShimmerMeetingSidebar from './ShimmerMeetingSidebar';
import ShimmerMeetingStreamsWrapper from './ShimmerMeetingStreamsWrapper';

const ShimmerEntryMeetingView = (): ReactElement => (
	<Container orientation="horizontal" borderRadius="none">
		<ShimmerMeetingSidebar />
		<ShimmerMeetingStreamsWrapper />
	</Container>
);

export default ShimmerEntryMeetingView;
