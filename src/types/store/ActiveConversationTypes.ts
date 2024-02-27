/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AttachmentMessageType, TextMessage } from './MessageTypes';

export type ActiveConversation = {
	draftMessage?: string | undefined;
	scrollPositionMessageId?: string;
	isHistoryFullyLoaded?: boolean;
	isHistoryLoadDisabled?: boolean;
	inputHasFocus?: boolean;
	isWritingList?: string[];
	referenceMessage?: ReferenceMessage | undefined;
	infoPanelStatus?: InfoPanelStatus;
	filesToAttach?: FileToUpload[] | undefined;
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
