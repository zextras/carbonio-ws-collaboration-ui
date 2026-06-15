/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t } from '@zextras/carbonio-shell-ui';
import { forEach, last } from 'lodash';

import { downloadChatExport } from '../../../network/messaging/chatExportDownload';
import { xmppClient } from '../../../network/xmpp/XMPPClient';
import { getIsMongooseIM } from '../../../store/selectors/ConnectionSelector';
import { getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { Message, MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { ExportStatus } from '../../../types/store/SessionTypes';
import { formatDate } from '../../../utils/dateUtils';

export interface IChatExporter {
	addMessagesToFullHistory(messages: Message[]): void;
	continueExporting(): void;
	exportHistory(): void;
}

class ChatExporter implements IChatExporter {
	readonly roomId: string;

	fullHistory: Message[] = [];

	constructor(roomId: string) {
		this.roomId = roomId;
		const isMongooseIM = getIsMongooseIM(useStore.getState());
		if (isMongooseIM) {
			// XMPP: request history via MAM; results come back via addMessagesToFullHistory
			xmppClient.requestFullHistory(this.roomId);
		} else {
			// WSC: the backend streams the .txt directly — trigger a native browser download.
			const chatName = getRoomNameSelector(useStore.getState(), this.roomId);
			downloadChatExport(this.roomId, chatName);
			// Clear the exporting/loading state immediately; the browser owns the download from here.
			useStore.getState().setChatExporting();
		}
	}

	public addMessagesToFullHistory(messages: Message[]): void {
		this.fullHistory.push(...messages);
	}

	public async continueExporting(): Promise<void> {
		// XMPP only: delegate to MAM pagination; results call back into addMessagesToFullHistory.
		const from = last(this.fullHistory)?.date ?? 0;
		xmppClient.requestFullHistory(this.roomId, from);
	}

	public exportHistory(): void {
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
		// Support both MongooseIM (deleted boolean) and common-socket (deletedInfo object)
		if (message.deleted || message.deletedInfo) {
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
