/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Container, Icon, IconButton } from '@zextras/carbonio-design-system';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { CHATS_ROUTE } from '../constants/appConstants';
import { getSelectedRoomId } from '../store/selectors/SessionSelectors';
import useStore from '../store/Store';

const CustomLabel = styled(Container)`
	position: absolute;
	top: 0.375rem;
	left: 0;
	padding: 0.063rem;
	font-size: 0.375rem;
	color: white;
	border-radius: 0 2px 2px 0;
	writing-mode: vertical-rl;
	text-orientation: upright;
	user-select: none;
`;

const CustomSettingsContainer = styled.div`
	position: relative;
`;

const CustomSettingsLabel = styled(CustomLabel)`
	top: -0.5rem;
	left: -1rem;
`;

const LogoBeta = ({ active }: { active: boolean }): JSX.Element => {
	const history = useHistory();
	const selectedRoom: string | undefined = useStore(getSelectedRoomId);

	const goToChats = useCallback(() => {
		const route = selectedRoom ? `/${CHATS_ROUTE}/${selectedRoom}` : `/${CHATS_ROUTE}`;
		history.push(route);
	}, [history, selectedRoom]);

	return (
		<>
			<IconButton
				icon="TeamOutline"
				size={'large'}
				iconColor={active ? 'primary' : 'gray0'}
				onClick={goToChats}
			/>
			<CustomLabel background="info" height="2.25rem" width="fit">
				BETA
			</CustomLabel>
		</>
	);
};

const LogoSettingsBeta = (): JSX.Element => (
	<CustomSettingsContainer>
		<Icon icon="TeamOutline" size={'large'} />
		<CustomSettingsLabel background="info" height="2.5rem" width="fit">
			BETA
		</CustomSettingsLabel>
	</CustomSettingsContainer>
);

export { LogoBeta, LogoSettingsBeta };
