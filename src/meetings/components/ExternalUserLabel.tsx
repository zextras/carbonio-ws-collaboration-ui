/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const CustomText = styled(Text)`
	flex-shrink: 0;
`;

const ExternalUserLabel = (): ReactElement => {
	const [t] = useTranslation();
	const guestLabel = t('guest', 'Guest');
	return (
		<>
			<CustomText size="small" color={'gray1'}>
				{'·'}
			</CustomText>
			<CustomText size="small" color={'gray1'}>
				{guestLabel}
			</CustomText>
		</>
	);
};

export default ExternalUserLabel;
