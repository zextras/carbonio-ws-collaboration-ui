/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createMemoryHistory } from 'history';
import React, { ReactElement } from 'react';
import { Switch, Route, Router } from 'react-router-dom';

import AccessMeetingPageView from './AccessMeetingPageView';
import InfoPage from './InfoPage';
import MeetingPageView from './MeetingPageView';
import { MEETINGS_ROUTES, ROUTES } from '../../hooks/useRouting';

const ExternalMainView = (): ReactElement => {
	const history = createMemoryHistory();

	return (
		<Router history={history}>
			<Switch>
				<Route exact path={ROUTES.MAIN} component={AccessMeetingPageView} />
				<Route exact path={MEETINGS_ROUTES.MEETING} component={MeetingPageView} />
				<Route exact path={MEETINGS_ROUTES.INFO} component={InfoPage} />
			</Switch>
		</Router>
	);
};

export default ExternalMainView;
