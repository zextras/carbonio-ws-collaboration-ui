/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AttachmentMessageType, Message, TextMessage } from './ChatsRegistryTypes';

export type ActiveConversationsSlice = {
	activeConversations: ActiveConversationsMap;
	setScrollPosition: (roomId: string, messageId: string) => void;
	setInputHasFocus: (roomId: string, hasFocus: boolean) => void;
	setIsWriting: (roomId: string, userId: string, writingStatus: boolean) => void;
	setReferenceMessage: (
		roomId: string,
		reference: {
			messageId: string;
			senderId: string;
			stanzaId: string;
			actionType: messageActionType;
			attachment?: AttachmentMessageType;
		}
	) => void;
	setDraftMessage: (roomId: string, message?: string) => void;
	unsetReferenceMessage: (roomId: string) => void;
	setLastMamMessage: (message: Message) => void;
	setHistoryIsFullyLoaded: (roomId: string) => void;
	setHistoryLoadDisabled: (roomId: string, status: boolean) => void;
	setActionsAccordionStatus: (roomId: string, status: boolean) => void;
	setParticipantsAccordionStatus: (roomId: string, status: boolean) => void;
	setFilesToAttach: (roomId: string, files: FileToUpload[]) => void;
	setFileFocusedToModify: (roomId: string, fileTempId: string, active: boolean) => void;
	addDescriptionToFileToAttach: (roomId: string, fileTempId: string, description: string) => void;
	removeDescriptionToFileToAttach: (roomId: string, fileTempId: string) => void;
	removeFileToAttach: (roomId: string, fileTempId: string) => void;
	unsetFilesToAttach: (roomId: string) => void;
	setForwardMessageList: (roomId: string, message: TextMessage) => void;
	unsetForwardMessageList: (roomId: string, message?: TextMessage) => void;
	setNewReaction: (roomId: string, stanzaId: string, reaction: string, from: string) => void;
};

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
	newReactions?: NewReaction[];
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

type NewReaction = {
	stanzaId: string;
	reaction: string;
};
