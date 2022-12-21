/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type HealthStatus = {
	isLive: boolean;
	status: HealthStatusType;
	dependencies: DependencyHealth[];
};

export enum HealthStatusType {
	OK = 'ok',
	WARN = 'warn',
	ERROR = 'error'
}

export type DependencyHealth = {
	name: DependencyHealthType;
	isHealthy: boolean;
};

export enum DependencyHealthType {
	DATABASE = 'database',
	XMPP_SERVER = 'xmpp_server',
	EVENT_DISPATCHER = 'event_dispatcher',
	STORAGE = 'storage_service',
	PREVIEWER = 'previewer_service',
	AUTHENTICATION = 'authentication_service',
	PROFILING = 'profiling_service'
}
