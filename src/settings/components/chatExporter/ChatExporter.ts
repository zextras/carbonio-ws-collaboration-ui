/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t } from '@zextras/carbonio-shell-ui';
import { forEach, last } from 'lodash';

import { getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { Message, MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { ExportStatus } from '../../../types/store/SessionTypes';
import { formatDate } from '../../../utils/dateUtils';
import ChatApi from '../../../network/apis/ChatApi';

export interface IChatExporter {
	addMessagesToFullHistory(messages: Message[]): void;
	continueExporting(): void;
	exportHistory(): void;
}

class ChatExporter implements IChatExporter {
	readonly roomId: string;

	fullHistory: Message[] = [];

	private isLoading = false;

	constructor(roomId: string) {
		this.roomId = roomId;
		this.loadFullHistory();
	}

	private async loadFullHistory(): Promise<void> {
		if (this.isLoading) return;
		this.isLoading = true;

		try {
			// Load messages in batches using REST API
			const response = await ChatApi.getMessageHistory(this.roomId, undefined, 100);
			if (response && Array.isArray(response)) {
				this.fullHistory = response;
			}
		} catch (error) {
			console.error('[ChatExporter] Failed to load history:', error);
		} finally {
			this.isLoading = false;
		}
	}

	public addMessagesToFullHistory(messages: Message[]): void {
		this.fullHistory.push(...messages);
	}

	public async continueExporting(): Promise<void> {
		const lastMessage = last(this.fullHistory);
		if (!lastMessage) {
			this.exportHistory();
			return;
		}

		try {
			const response = await ChatApi.getMessageHistory(
				this.roomId,
				new Date(lastMessage.date).toISOString(),
				100
			);
			if (response && Array.isArray(response) && response.length > 0) {
				this.fullHistory.push(...response);
				// Continue loading if we got a full batch
				if (response.length >= 100) {
					await this.continueExporting();
				} else {
					this.exportHistory();
				}
			} else {
				this.exportHistory();
			}
		} catch (error) {
			console.error('[ChatExporter] Failed to continue loading:', error);
			this.exportHistory();
		}
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
