/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t } from '@zextras/carbonio-shell-ui';
import { forEach, last } from 'lodash';

import { getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import IXMPPClient from '../../../types/network/xmpp/IXMPPClient';
import { Message, MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { ExportStatus } from '../../../types/store/SessionTypes';
import { formatDate } from '../../../utils/dateUtils';

export interface IChatExporter {
	addMessageToFullHistory(message: Message): void;
	handleFullHistoryResponse(isHistoryComplete: boolean): void;
}

class ChatExporter implements IChatExporter {
	private roomId: string;

	private fullHistory: Message[] = [];

	private xmppClient: IXMPPClient = useStore.getState().connections.xmppClient;

	constructor(roomId: string) {
		this.roomId = roomId;
		this.xmppClient.requestFullHistory(this.roomId);
	}

	public addMessageToFullHistory(message: Message): void {
		this.fullHistory.push(message);
	}

	public handleFullHistoryResponse(isHistoryComplete: boolean): void {
		if (isHistoryComplete) {
			this.exportHistory();
		} else {
			const from = last(this.fullHistory)?.date || 0;
			this.xmppClient.requestFullHistory(this.roomId, from);
		}
	}

	private exportHistory(): void {
		let content = '';
		forEach(this.fullHistory, (message) => {
			if (message.type === MessageType.TEXT_MSG) {
				content += this.messageFormatter(message);
			}
		});
		useStore.getState().setChatExportStatus(ExportStatus.DOWNLOADING);

		// Create and download the file
		const blob = new Blob([content], { type: 'text/plain' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		const chatName = getRoomNameSelector(useStore.getState(), this.roomId);
		link.download = `${chatName}.txt`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Reset the exporting state
		useStore.getState().setChatExporting();
	}

	private messageFormatter(message: TextMessage): string {
		const senderName = useStore.getState().users[message.from]?.name || message.from;
		const header = `[${formatDate(message.date, 'YYYY-MM-DD HH:mm:ss')}] ${senderName}: `;
		if (message.deleted) {
			const deletedMessage = t('message.deletedMessage', 'Deleted message');
			return `${header}[${deletedMessage}]\n`;
		}
		if (message.attachment) {
			const attachmentName = message.attachment.name || '';
			return `${header}[${attachmentName}] ${message.text}\n`;
		}
		return `${header}${message.text}\n`;
	}
}

export default ChatExporter;
