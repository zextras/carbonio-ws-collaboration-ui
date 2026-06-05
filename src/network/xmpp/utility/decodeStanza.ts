/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

export const getTagElement = (stanza: Element, tagName: string): Element | null => {
	const elementList = stanza.getElementsByTagName(tagName);
	if (size(elementList) === 0) {
		return null;
	}
	return stanza.getElementsByTagName(tagName)[0];
};

export const getRequiredTagElement = (stanza: Element, tagName: string): Element => {
	const elementList = stanza.getElementsByTagName(tagName);
	if (size(elementList) === 0) {
		throw new Error(`No ${tagName} tag found`);
	}
	return stanza.getElementsByTagName(tagName)[0];
};

export const getAttribute = (stanza: Element, attributeName: string): string | null =>
	stanza.getAttribute(attributeName);

export const getRequiredAttribute = (stanza: Element, attributeName: string): string => {
	const attribute = stanza.getAttribute(attributeName);
	if (!attribute) {
		throw new Error(`No ${attributeName} attribute found`);
	}
	return attribute;
};
