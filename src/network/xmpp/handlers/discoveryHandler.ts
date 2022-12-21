/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * SERVICE DISCOVERY (XEP-0030)
 * Documentation: https://xmpp.org/extensions/xep-0030.html
 */

export function onGetServiceDiscoveryItemsResponse(stanza: Element): true {
	// Discover associated services
	console.log('Service Discovery Items:', stanza);
	return true;
}

export function onGetServiceDiscoveryInfoResponse(stanza: Element): true {
	// Discover if a service implements the Multi-User Chat protocol
	console.log('Service Discovery Info:', stanza);
	return true;
}

export function onGetDiscoverMUCItemsResponse(stanza: Element): true {
	// Discover MUC items
	console.log('Discover MUC Items:', stanza);
	return true;
}
