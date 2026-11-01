/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { every, isArray, isString } from 'lodash';

import {
	WIDGET_CONTRACT_VERSION,
	type DashboardWidgetAction,
	type SerializedWidgetConfig
} from './dashboardWidgetTypes';
import UnreadChatsWidget from './UnreadChatsWidget';
import UnreadChatsWidgetSettings from './UnreadChatsWidgetSettings';
import { CHATS_APP_ID } from '../../constants/appConstants';

export type UnreadChatsConfig = { roomIds: string[] };

const CONFIG_VERSION = 1;

const DEFAULT_CONFIG: UnreadChatsConfig = { roomIds: [] };

export const UNREAD_CHATS_WIDGET_ID = `${CHATS_APP_ID}:unread-chats`;

export const deserializeUnreadChatsConfig = (
	serialized: SerializedWidgetConfig | undefined
): UnreadChatsConfig => {
	try {
		const parsed = serialized?.v === CONFIG_VERSION ? JSON.parse(serialized.data) : undefined;
		return isArray(parsed?.roomIds) && every(parsed.roomIds, isString)
			? { roomIds: parsed.roomIds }
			: DEFAULT_CONFIG;
	} catch {
		return DEFAULT_CONFIG;
	}
};

export const unreadChatsWidget: DashboardWidgetAction<UnreadChatsConfig> = {
	id: UNREAD_CHATS_WIDGET_ID,
	label: 'Unread chats messages',
	icon: 'MessageCircleOutline',
	execute: () => undefined,
	contractVersion: WIDGET_CONTRACT_VERSION,
	defaultSize: { columns: 4, rows: 5 },
	Component: UnreadChatsWidget,
	SettingsComponent: UnreadChatsWidgetSettings,
	defaultConfig: DEFAULT_CONFIG,
	serialize: (config) => ({ v: CONFIG_VERSION, data: JSON.stringify(config) }),
	deserialize: deserializeUnreadChatsConfig
};
