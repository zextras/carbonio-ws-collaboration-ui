/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, useTheme } from '@zextras/carbonio-design-system';
import React, { ReactElement, useMemo } from 'react';

import AccessMeetingModal from '../components/AccessMeetingModal';

const AccessMeetingPageView = (): ReactElement => {
	// Retrieve room information
	const roomId: string = useMemo(() => document.location.pathname.split('external/')[1], []);

	const theme = useTheme();

	return (
		<Container background={theme.palette.gray1.hover}>
			{roomId && <AccessMeetingModal roomId={roomId} />}
		</Container>
	);
};

export default AccessMeetingPageView;
