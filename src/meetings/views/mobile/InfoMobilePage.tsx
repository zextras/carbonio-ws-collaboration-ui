/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import MobileContainer from './MobileContainer';
import InfoPage from '../InfoPage';

const InfoMobilePage = (): ReactElement => (
	<MobileContainer>
		<InfoPage />
	</MobileContainer>
);

export default InfoMobilePage;
