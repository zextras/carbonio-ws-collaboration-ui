/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Spinner } from '@zextras/carbonio-design-system';

import useStore from '../../store/Store';
import Settings from '../components/Settings';

const SettingsView = (): ReactElement => {
	const id: string | undefined = useStore((store) => store.session.id);
	if (!id) {
		return (
			<Container>
				<Spinner color={'primary'} />
			</Container>
		);
	}
	return <Settings />;
};

export default SettingsView;
