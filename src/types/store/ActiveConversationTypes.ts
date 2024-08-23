/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AttachmentMessageType, Message, TextMessage } from './MessageTypes';

export type ActiveConversation = {
	draftMessage?: string;
	scrollPositionMessageId?: string;
	lastMamMessage?: Message;
	isHistoryFullyLoaded?: boolean;
	isHistoryLoadDisabled?: boolean;
	inputHasFocus?: boolean;
	isWritingList?: string[];
	referenceMessage?: ReferenceMessage;
	infoPanelStatus?: InfoPanelStatus;
	filesToAttach?: FileToUpload[];
	forwardMessageList?: TextMessage[];
};

export type ActiveConversationsMap = {
	[roomId: string]: ActiveConversation;
};

export enum messageActionType {
	EDIT = 'edit',
	REPLY = 'reply'
}

export type ReferenceMessage = {
	roomId: string;
	messageId: string;
	senderId: string;
	stanzaId: string;
	actionType: messageActionType;
	attachment?: AttachmentMessageType;
};

type InfoPanelStatus = {
	participantsAccordionIsOpened: boolean;
	actionsAccordionIsOpened: boolean;
};

export type FileToUpload = {
	file: File;
	fileId: string;
	localUrl: string;
	description: string;
	hasFocus: boolean;
};
