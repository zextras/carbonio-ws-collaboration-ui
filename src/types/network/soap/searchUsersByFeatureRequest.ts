/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type SearchUsersByFeatureRequest = {
	_jsns: 'urn:zimbraAccount';
	name: string;
	feature: 'WSC';
	offset: number;
};

export type SearchUsersByFeatureResponseType = {
	account: ContactMatch[];
	more: boolean;
	total: number;
};

export type ContactMatch = {
	a: { n: string; _content: string }[];
	id: string;
	name: string;
};

export type SearchUsersByFeatureSoapResponse = {
	contacts: ContactInfo[];
	more: boolean;
	total: number;
};

export type ContactInfo = {
	id: string;
	displayName: string;
	email: string;
};
