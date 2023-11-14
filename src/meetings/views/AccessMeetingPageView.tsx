/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo } from 'react';

import { Container, useTheme } from '@zextras/carbonio-design-system';

import { MEETINGS_PATH } from '../../constants/appConstants';
import AccessMeetingModal from '../components/AccessMeetingModal';

const AccessMeetingPageView = (): ReactElement => {
	// Retrieve room information
	const roomId: string = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const theme = useTheme();

	return (
		<Container background={theme.palette.gray1.hover}>
			{roomId && <AccessMeetingModal roomId={roomId} />}
		</Container>
	);
};

export default AccessMeetingPageView;
