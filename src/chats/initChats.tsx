/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, Suspense, useCallback, useEffect } from 'react';

import { Container, ModalManager, Spinner } from '@zextras/carbonio-design-system';
import { addRoute, SecondaryBarComponentProps } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import ConnectionSnackbarManager from './components/ConnectionSnackbarManager';
import PreviewNavigationManager from './components/PreviewNavigationManager';
import { CHATS_ROUTE, PRODUCT_NAME } from '../constants/appConstants';
import useEventListener from '../hooks/useEventListener';
import SecondaryBarView from './components/secondaryBar/SecondaryBarView';
import ShimmeringConversationView from './views/shimmerViews/ShimmeringConversationView';
import ShimmeringInfoPanelView from './views/shimmerViews/ShimmeringInfoPanelView';
import { EventName, EventPayloads } from 'wsc-shared';

const LazyMainView = lazy(() => import(/* webpackChunkName: "mainView" */ './views/MainView'));

const ChatsMain = (): React.JSX.Element => (
	<Suspense
		fallback={
			<Container mainAlignment="flex-start" orientation="horizontal">
				<ShimmeringConversationView />
				<ShimmeringInfoPanelView />
			</Container>
		}
	>
		<ModalManager>
			<ConnectionSnackbarManager />
			<PreviewNavigationManager />
			<LazyMainView />
		</ModalManager>
	</Suspense>
);

const SecondaryBar = (props: SecondaryBarComponentProps): React.JSX.Element => (
	<Suspense
		fallback={
			<Container>
				<Spinner color={'primary'} />
			</Container>
		}
	>
		<ModalManager>
			<SecondaryBarView {...props} />
		</ModalManager>
	</Suspense>
);

export default function useChatsApp(): void {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const handleRedirectFromBrowserNotification = useCallback(
		(event: EventPayloads[EventName.ROUTE_REDIRECT]) => {
			if (event.path) {
				navigate(event.path);
			}
		},
		[navigate]
	);

	useEventListener(EventName.ROUTE_REDIRECT, handleRedirectFromBrowserNotification);

	useEffect(() => {
		addRoute({
			route: CHATS_ROUTE,
			visible: true,
			label: t('label.app_name', PRODUCT_NAME),
			primaryBar: 'WscOutline',
			appView: ChatsMain,
			secondaryBar: SecondaryBar
		});
	}, [t]);
}
