/* eslint-disable prettier/prettier */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, find, includes, last, map } from "lodash";

import { FileToUpload, ReferenceMessage } from "../../types/store/ActiveConversationTypes";
import { MessageType, TextMessage } from "../../types/store/ChatsRegistryTypes";
import { RootStore } from "../../types/store/StoreTypes";

export const getReferenceMessage = (
	store: RootStore,
	roomId: string
): ReferenceMessage | undefined => store.activeConversations[roomId]?.referenceMessage;

export const getIdMessageWhereScrollIsStopped = (
	store: RootStore,
	roomId: string
): string | undefined => store.activeConversations[roomId]?.scrollPositionMessageId;

export const getHistoryIsFullyLoaded = (store: RootStore, roomId: string): boolean | undefined =>
	store.activeConversations[roomId]?.isHistoryFullyLoaded;

export const getHistoryIsLoadedDisabled = (store: RootStore, roomId: string): boolean | undefined =>
	store.activeConversations[roomId]?.isHistoryLoadDisabled;

export const getInputHasFocus = (store: RootStore, roomId: string): boolean | undefined =>
	store.activeConversations[roomId]?.inputHasFocus;

export const getActionsAccordionStatus = (store: RootStore, roomId: string): boolean => {
	if (store.activeConversations[roomId]?.infoPanelStatus)
		return store.activeConversations[roomId].infoPanelStatus!.actionsAccordionIsOpened;
	return true;
};

export const getParticipantsAccordionStatus = (store: RootStore, roomId: string): boolean => {
	if (store.activeConversations[roomId]?.infoPanelStatus)
		return store.activeConversations[roomId].infoPanelStatus!.participantsAccordionIsOpened;
	return true;
};

export const getDraftMessage = (store: RootStore, roomId: string): string | undefined =>
	store.activeConversations[roomId] ? store.activeConversations[roomId]?.draftMessage?.text : '';

export const getFilesToUploadArray = (
	store: RootStore,
	roomId: string
): FileToUpload[] | undefined => store.activeConversations[roomId]?.filesToAttach;

export const getFocusedFile = (store: RootStore, roomId: string): string | undefined => {
    const files = store.activeConversations[roomId]?.filesToAttach;
    return files?.find(file => file.hasFocus)?.fileId;
};

export const getForwardList = (store: RootStore, roomId: string): TextMessage[] | undefined =>
	store.activeConversations[roomId]?.forwardMessageList;

export const isMessageInForwardList = (
	store: RootStore,
	roomId: string,
	message: TextMessage
): boolean => {
	if (store.activeConversations[roomId]?.forwardMessageList) {
		const messageToFind = find(
			store.activeConversations[roomId]?.forwardMessageList,
			(element) => element === message
		);
		return messageToFind !== undefined;
	}
	return false;
};

export const maxForwardLimitNotReached = (store: RootStore, roomId: string): boolean => {
	if (store.activeConversations[roomId]?.forwardMessageList) {
		return store.activeConversations[roomId].forwardMessageList!.length < 20;
	}
	return true;
};

export const getIsNewReaction = (
	store: RootStore,
	roomId: string,
	stanzaId: string,
	reaction: string
): boolean => {
	const activeConversations = store.activeConversations[roomId];
	if (activeConversations?.newReactions) {
		const newReactions = filter(
			activeConversations.newReactions,
			(reaction) => reaction.stanzaId === stanzaId
		);
		return includes(map(newReactions, 'reaction'), reaction);
	}
	return false;
};

export const getLastNewReaction = (store: RootStore, roomId: string): string | undefined => {
	if (store.activeConversations[roomId]?.newReactions) {
		return last(store.activeConversations[roomId].newReactions)?.reaction;
	}
	return undefined;
};

export const getIsMessageSelected = (store: RootStore, roomId: string, stanzaId: string): boolean =>
    store.activeConversations[roomId]?.selectedSearchResult === stanzaId;

export const getIsMessageSelectedAlreadyStored = (store: RootStore, roomId: string, stanzaId: string): boolean =>
!!store.chatsRegistry[roomId]?.messages.find(msg => msg.type === MessageType.TEXT_MSG && msg.stanzaId === stanzaId);

export const getPinnedMessage = (store: RootStore, roomId: string): TextMessage | undefined =>
	store.activeConversations[roomId]?.messagePinned;

export const getIsPinnedMessageSelected = (store: RootStore, roomId: string, stanzaId: string): boolean =>
	store.activeConversations[roomId]?.selectedPinnedMessage === stanzaId;
