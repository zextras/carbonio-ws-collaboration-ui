/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MamRequestType, onHistoryMessageStanza } from './historyMessageHandler';
import useStore from '../../../store/Store';
import {
	historyTextMessageStanza,
	reactionMessageFromHistoryStanza,
	replyTextMessageStanza
} from '../../../tests/mocks/XMPPStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

describe('onHistoryMessageStanza', () => {
	test('Handle text history message stanza', () => {
		onHistoryMessageStanza(
			historyTextMessageStanza('roomId', 'from', 'body', MamRequestType.HISTORY)
		);
		expect(HistoryAccumulator.returnHistory('roomId')).toHaveLength(1);
	});

	test('Handle fastening history message stanza ', () => {
		onHistoryMessageStanza(
			reactionMessageFromHistoryStanza(
				'roomId',
				'originalStanzaId',
				'userId',
				MamRequestType.HISTORY
			)
		);
		expect(useStore.getState().fastenings.roomId.originalStanzaId).toHaveLength(1);
	});

	test('Handle replied history message stanza', () => {
		onHistoryMessageStanza(
			replyTextMessageStanza('roomId', 'from', 'body', MamRequestType.REPLIED, 'stanzaId')
		);
		expect(HistoryAccumulator.returnReferenceForRepliedMessage('stanzaId')).toBeDefined();
	});
});
