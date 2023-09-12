/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useMemo } from 'react';

import { MEETINGS_PATH } from '../../constants/appConstants';
import AccessMeetingModal from '../components/AccessMeetingModal';

const AccessMeetingPageView = (): ReactElement => {
	// Retrieve room information
	const roomId: string = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	return (
		<Container background={'gray1'}>{roomId && <AccessMeetingModal roomId={roomId} />}</Container>
	);
};

export default AccessMeetingPageView;
