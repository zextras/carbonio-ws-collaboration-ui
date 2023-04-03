/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React from 'react';

type SecondaryBarProps = {
	expanded: boolean;
};

const MeetingsSecondaryBar: React.FC<SecondaryBarProps> = ({ expanded }) =>
	expanded ? <Container mainAlignment="flex-start" /> : <Container mainAlignment="flex-start" />;

export default MeetingsSecondaryBar;
