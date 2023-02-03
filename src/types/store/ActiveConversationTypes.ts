/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ActiveConversation = {
	draftMessage?: string | undefined;
	scrollPositionMessageId?: string;
	isHistoryFullyLoaded?: boolean;
	isHistoryLoadDisabled?: boolean;
	pinnedMessage?: object;
	inputHasFocus?: boolean;
	isWritingList?: string[];
	referenceMessage?: ReferenceMessage | undefined;
	infoPanelStatus?: InfoPanelStatus;
};

export type ActiveConversationsMap = {
	[roomId: string]: ActiveConversation;
};

export enum messageActionType {
	EDIT = 'edit',
	REPLAY = 'reply'
}

export type ReferenceMessage = {
	roomId: string;
	messageId: string;
	senderId: string;
	stanzaId: string;
	actionType: messageActionType;
};

type InfoPanelStatus = {
	participantsAccordionIsOpened: boolean;
	actionsAccordionIsOpened: boolean;
};
