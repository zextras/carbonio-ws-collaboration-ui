/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Spinner } from '@zextras/carbonio-shell-ui';
import React, { ReactElement } from 'react';

import Settings from '../components/settings/Settings';
import useStore from '../store/Store';

const SettingsView = (): ReactElement => {
	const id: string | undefined = useStore((store) => store.session.id);
	if (id === undefined) {
		return <Spinner />;
	}
	return <Settings id={id} />;
};

export default SettingsView;
