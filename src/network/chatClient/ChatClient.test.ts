/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatClient, isWscPure } from './ChatClient';
import useStore from '../../store/Store';
import { xmppClient } from '../xmpp/XMPPClient';

describe('chatClient façade', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('delegates to the XMPP stack against a legacy backend', () => {
		useStore.getState().setApiVersion('1.6.13');
		const spy = vi.spyOn(xmppClient, 'sendChatMessage').mockImplementation(() => undefined);

		chatClient.sendChatMessage('room-id', 'hello');

		expect(isWscPure()).toBeFalsy();
		expect(spy).toHaveBeenCalledWith('room-id', 'hello');
	});

	it('delegates to the XMPP stack when no version has been negotiated yet', () => {
		// Explicit: previous tests may have negotiated a version on the shared store
		useStore.setState({ session: { ...useStore.getState().session, apiVersion: undefined } });
		const spy = vi.spyOn(xmppClient, 'sendChatMessage').mockImplementation(() => undefined);

		chatClient.sendChatMessage('room-id', 'hello');

		expect(isWscPure()).toBeFalsy();
		expect(spy).toHaveBeenCalledWith('room-id', 'hello');
	});

	it('does not touch the XMPP stack against a WSC-pure backend', () => {
		useStore.getState().setApiVersion('2.0.0');
		const spy = vi.spyOn(xmppClient, 'sendChatMessage').mockImplementation(() => undefined);

		chatClient.sendChatMessage('room-id', 'hello');

		expect(isWscPure()).toBeTruthy();
		expect(spy).not.toHaveBeenCalled();
	});

	it('skips the XMPP connection against a WSC-pure backend', () => {
		useStore.getState().setApiVersion('2.0.0');
		const spy = vi.spyOn(xmppClient, 'connect').mockImplementation(() => undefined);

		chatClient.connect('token');

		expect(spy).not.toHaveBeenCalled();
	});

	it('resolves the promise-returning methods without XMPP against a WSC-pure backend', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const spy = vi.spyOn(xmppClient, 'fullTextSearch');

		await expect(chatClient.fullTextSearch('room-id', 'text')).resolves.toBeUndefined();
		await expect(
			chatClient.requestMessageToForward('room-id', 'stanza-id', 'query-id')
		).resolves.toBeUndefined();

		expect(spy).not.toHaveBeenCalled();
	});

	it('exposes the live XMPP features list', () => {
		xmppClient.features = ['zextras:iq:pin'];

		expect(chatClient.features).toEqual(['zextras:iq:pin']);

		xmppClient.features = [];
	});
});
