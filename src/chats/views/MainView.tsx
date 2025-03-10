/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, ReactElement } from 'react';

import { Route, Routes } from 'react-router-dom';

import { ROUTES } from '../../hooks/useRouting';

const LazyDefault = lazy(() => import(/* webpackChunkName: "defaultView" */ './DefaultView'));
const LazyRoom = lazy(() => import(/* webpackChunkName: "roomView" */ './RoomView'));

const MainView = (): ReactElement => (
	<Routes>
		<Route path={ROUTES.MAIN} element={<LazyDefault />} />
		<Route path={ROUTES.ROOM} element={<LazyRoom />} />
	</Routes>
);

export default MainView;
