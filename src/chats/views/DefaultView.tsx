/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import DefaultUserView from './DefaultUserView';
import { getRoomIdsList } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';

const DefaultView = (): ReactElement => {
	const roomsIds = useStore<string[]>(getRoomIdsList);

	return (
		<Container mainAlignment="flex-start">
			<DefaultUserView roomsIds={roomsIds} />
		</Container>
	);
};

export default DefaultView;
