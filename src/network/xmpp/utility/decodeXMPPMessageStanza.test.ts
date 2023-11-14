/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { decodeXMPPMessageStanza } from './decodeXMPPMessageStanza';
import { MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { retractedMessage } from '../xmppMessageExamples';

const applicationXml = 'application/xml';

describe('Test decode message function', () => {
	test('Parse special chars', async () => {
		const messageToParse = `<message from='b8f6dc34-9b36-4956-a8ab-9b44a0b21951@muclight.carbonio/c755b1d5-08dd-49d8-bec8-59074090ef1b@carbonio' to='9b91c824-9ef7-4f86-b2ca-30b456d2641d@carbonio' id='1665-52642-42267' type='groupchat' xmlns='jabber:client'><body>&quot;ciao &gt; &apos;ragazzi&apos; &amp; &apos;ragazze&apos; &lt;&quot;</body><markable xmlns='urn:xmpp:chat-markers:0'/><stanza-id by='b8f6dc34-9b36-4956-a8ab-9b44a0b21951@muclight.carbonio' id='BQIR8T1E2281' xmlns='urn:xmpp:sid:0'/></message>`;
		const parser = new DOMParser();
		const xmlToParse = parser.parseFromString(messageToParse, applicationXml);
		const messageParsed = decodeXMPPMessageStanza(xmlToParse.getElementsByTagName('message')[0]);
		expect(messageParsed?.type).toBe(MessageType.TEXT_MSG);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		expect(messageParsed?.text).toBe(`"ciao > 'ragazzi' & 'ragazze' <"`);
	});

	test('Parse special chars in a complex phrase', async () => {
		const messageToParse = `<message from='b8f6dc34-9b36-4956-a8ab-9b44a0b21951@muclight.carbonio/c755b1d5-08dd-49d8-bec8-59074090ef1b@carbonio' to='9b91c824-9ef7-4f86-b2ca-30b456d2641d@carbonio' id='1665-52642-42267' type='groupchat' xmlns='jabber:client'><body>sto provando a testare una cosa (anche se &quot;testare&quot; è difficile),un po' mi piace. Inoltre, 2 &lt; 3 e 5 &gt; 1! Ciao a tutt* da Yuki &amp; co!</body><markable xmlns='urn:xmpp:chat-markers:0'/><stanza-id by='b8f6dc34-9b36-4956-a8ab-9b44a0b21951@muclight.carbonio' id='BQIR8T1E2281' xmlns='urn:xmpp:sid:0'/></message>`;
		const parser = new DOMParser();
		const xmlToParse = parser.parseFromString(messageToParse, applicationXml);
		const messageParsed = decodeXMPPMessageStanza(xmlToParse.getElementsByTagName('message')[0]);
		expect(messageParsed?.type).toBe(MessageType.TEXT_MSG);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		expect(messageParsed?.text).toBe(
			`sto provando a testare una cosa (anche se "testare" è difficile),un po' mi piace. Inoltre, 2 < 3 e 5 > 1! Ciao a tutt* da Yuki & co!`
		);
	});

	test('Parse special chars in a phrase with url', async () => {
		const messageToParse = `<message from='b8f6dc34-9b36-4956-a8ab-9b44a0b21951@muclight.carbonio/c755b1d5-08dd-49d8-bec8-59074090ef1b@carbonio' to='9b91c824-9ef7-4f86-b2ca-30b456d2641d@carbonio' id='1665-52642-42267' type='groupchat' xmlns='jabber:client'><body>se vai sul sito &lt; www.zextras.com &gt; troverai un sacco di informazioni! Puoi cercarlo anche su &quot; www.google.it &quot;</body><markable xmlns='urn:xmpp:chat-markers:0'/><stanza-id by='b8f6dc34-9b36-4956-a8ab-9b44a0b21951@muclight.carbonio' id='BQIR8T1E2281' xmlns='urn:xmpp:sid:0'/></message>`;
		const parser = new DOMParser();
		const xmlToParse = parser.parseFromString(messageToParse, applicationXml);
		const messageParsed = decodeXMPPMessageStanza(xmlToParse.getElementsByTagName('message')[0]);
		expect(messageParsed?.type).toBe(MessageType.TEXT_MSG);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		expect(messageParsed?.text).toBe(
			`se vai sul sito < www.zextras.com > troverai un sacco di informazioni! Puoi cercarlo anche su " www.google.it "`
		);
	});

	test('Parse retracted message', async () => {
		const messageToParse = retractedMessage
			.replace('roomId', 'testRoomId')
			.replace('messageId', 'testMessageId')
			.replace('userId', 'testUserId');
		const parser = new DOMParser();
		const xmlToParse = parser.parseFromString(messageToParse, applicationXml);
		const messageParsed = decodeXMPPMessageStanza(
			xmlToParse.getElementsByTagName('message')[0]
		) as TextMessage;

		expect(messageParsed.type).toBe(MessageType.TEXT_MSG);
		expect(messageParsed.roomId).toBe('testRoomId');
		expect(messageParsed.id).toBe('testMessageId');
		expect(messageParsed.from).toBe('testUserId');
		expect(messageParsed.deleted).toBeTruthy();
	});
});
