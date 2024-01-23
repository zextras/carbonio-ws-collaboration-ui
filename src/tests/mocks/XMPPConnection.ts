/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const mockedXmppConnect = jest.fn();
export const mockedXmppSend = jest.fn();

jest.mock('../../network/xmpp/XMPPConnection', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		connect: mockedXmppConnect,
		send: mockedXmppSend
	})),
	XMPPRequestType: {
		IQ: 'IQ',
		PRESENCE: 'PRESENCE',
		MESSAGE: 'MESSAGE'
	}
}));
