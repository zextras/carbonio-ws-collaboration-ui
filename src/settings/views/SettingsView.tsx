/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Spinner } from '@zextras/carbonio-shell-ui';

import useStore from '../../store/Store';
import Settings from '../components/Settings';

const SettingsView = (): ReactElement => {
	const id: string | undefined = useStore((store) => store.session.id);
	if (id === undefined) {
		return <Spinner />;
	}
	return <Settings id={id} />;
};

export default SettingsView;
