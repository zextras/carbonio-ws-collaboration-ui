/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, ReactElement } from 'react';

import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { ROUTES } from '../../hooks/useRouting';

const LazyDefault = lazy(() => import(/* webpackChunkName: "defaultView" */ './DefaultView'));
const LazyRoom = lazy(() => import(/* webpackChunkName: "roomView" */ './RoomView'));

const MainView = (): ReactElement => {
	const { path } = useRouteMatch();

	return (
		<Switch>
			<Route exact path={path + ROUTES.MAIN} component={LazyDefault} />
			<Route path={path + ROUTES.ROOM} component={LazyRoom} />
		</Switch>
	);
};

export default MainView;
