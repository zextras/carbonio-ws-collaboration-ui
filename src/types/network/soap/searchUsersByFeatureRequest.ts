/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type SearchUsersByFeatureRequest = {
	_jsns: 'urn:zimbraAccount';
	name: string;
	feature: 'CHATS';
};

export type SearchUsersByFeatureResponse = {
	account: ContactMatch[];
} & { Fault: { Detail: { Error: { Code: string } } } };

export type ContactMatch = {
	a: { n: string; _content: string }[];
	id: string;
	name: string;
};

export type SearchUsersByFeatureSoapResponse = ContactInfo[];

export type ContactInfo = {
	id: string;
	displayName: string;
	email: string;
};
