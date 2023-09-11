/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';

const GridMode = (): ReactElement => (
	<Container data-testid="gridModeView">
		<Text> Grid mode</Text>
	</Container>
);

export default GridMode;
