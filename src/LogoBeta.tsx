/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Icon, IconButton } from '@zextras/carbonio-design-system';
import { replaceHistory } from '@zextras/carbonio-shell-ui';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import { CHATS_ROUTE } from './constants/appConstants';

const CustomLabel = styled(Container)`
	position: absolute;
	top: 5px;
	padding: 1px;
	font-size: 6px;
	color: white;
	border-radius: 2px 2px 0 0;
`;

const CustomSettingsContainer = styled.div`
	position: relative;
`;

const CustomSettingsLabel = styled(CustomLabel)`
	top: -8px;
	left: -5px;
`;

const LogoBeta = ({ active }: { active: boolean }): JSX.Element => {
	const goToChats = useCallback(() => {
		replaceHistory({
			path: `/`,
			route: CHATS_ROUTE
		});
	}, []);

	return (
		<>
			<IconButton
				icon="TeamOutline"
				size={'large'}
				iconColor={active ? 'primary' : 'gray0'}
				onClick={goToChats}
			/>
			<CustomLabel background="warning" height="fit" width="35px">
				beta
			</CustomLabel>
		</>
	);
};

const LogoSettingsBeta = (): JSX.Element => (
	<CustomSettingsContainer>
		<Icon icon="TeamOutline" size={'large'} />
		<CustomSettingsLabel background="warning" height="fit" width="35px">
			beta
		</CustomSettingsLabel>
	</CustomSettingsContainer>
);

export { LogoBeta, LogoSettingsBeta };
