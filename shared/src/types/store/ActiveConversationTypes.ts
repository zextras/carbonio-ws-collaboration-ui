/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AttachmentMessageType, TextMessage } from './ChatsRegistryTypes';

export enum InfoPanelTab {
	ACTIONS = 'actions',
	MEMBERS = 'members',
	MEDIA_GALLERY = 'media_gallery'
}

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
	unsetReferenceMessage: (roomId: string) => void;
	setDraftMessage: (roomId: string, message?: string) => void;
	setHistoryIsFullyLoaded: (roomId: string) => void;
	setHistoryLoadDisabled: (roomId: string, status: boolean) => void;
	setActionsAccordionStatus: (roomId: string, status: boolean) => void;
	setParticipantsAccordionStatus: (roomId: string, status: boolean) => void;
	setSelectedInfoTab: (roomId: string, tab: InfoPanelTab) => void;
	addFilesToAttach: (roomId: string, files: FileToUpload[]) => void;
	removeFilesToAttach: (roomId: string, fileId?: string) => void;
	setForwardMessageList: (roomId: string, message: TextMessage) => void;
	unsetForwardMessageList: (roomId: string, message?: TextMessage) => void;
	setNewReaction: (roomId: string, stanzaId: string, reaction: string, from: string) => void;
	unsetNewReactions: (roomId: string) => void;
	setSelectedSearchResult: (roomId: string, stanzaId: string | undefined) => void;
	setPinnedMessage: (roomId: string, message: TextMessage) => void;
	removePinnedMessage: (roomId: string) => void;
	setSelectedPinnedMessage: (roomId: string, stanzaId: string | undefined) => void;
};

export type ActiveConversation = {
	draftMessage?: { text: string; date: number };
	scrollPositionMessageId?: string;
	isHistoryFullyLoaded?: boolean;
	isHistoryLoadDisabled?: boolean;
	inputHasFocus?: boolean;
	isWritingList?: string[];
	referenceMessage?: ReferenceMessage;
	infoPanelStatus: InfoPanelStatus;
	filesToAttach?: FileToUpload[];
	forwardMessageList?: TextMessage[];
	newReactions?: NewReaction[];
	selectedSearchResult?: string;
	messagePinned?: TextMessage;
	selectedPinnedMessage?: string;
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
	selectedInfoTab: InfoPanelTab;
};

export type FileToUpload = {
	file: File;
	fileId: string;
	localUrl: string;
};

type NewReaction = {
	stanzaId: string;
	reaction: string;
};
