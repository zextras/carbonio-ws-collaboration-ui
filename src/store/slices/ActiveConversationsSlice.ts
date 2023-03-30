/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { find, remove } from 'lodash';

import { messageActionType } from '../../types/store/ActiveConversationTypes';
import { AttachmentMessageType } from '../../types/store/MessageTypes';
import { ActiveConversationsSlice, RootStore } from '../../types/store/StoreTypes';

export const useActiveConversationsSlice = (
	set: (...any: any) => void
): ActiveConversationsSlice => ({
	activeConversations: {},
	setInputHasFocus: (roomId: string, hasFocus: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId]) {
					draft.activeConversations[roomId].inputHasFocus = hasFocus;
				} else {
					draft.activeConversations[roomId] = {
						inputHasFocus: hasFocus
					};
				}
			}),
			false,
			'ACTIVE_CONVERSATIONS/SET_INPUT_FOCUS'
		);
	},
	setIsWriting: (roomId: string, userId: string, writingStatus: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId]) {
					if (draft.activeConversations[roomId]) {
						const isUserYetInWritingList = find(
							draft.activeConversations[roomId].isWritingList,
							(id) => id === userId
						);

						// If a new user is writing add it to the list
						if (writingStatus && !isUserYetInWritingList) {
							draft.activeConversations[roomId].isWritingList = [
								...(draft.activeConversations[roomId].isWritingList || []),
								userId
							];
						}
						// If pause writing event arrives remove the user from the writing list
						if (
							!writingStatus &&
							isUserYetInWritingList &&
							draft.activeConversations[roomId].isWritingList
						) {
							remove(draft.activeConversations[roomId].isWritingList!, (id) => id === userId);
							if (draft.activeConversations[roomId].isWritingList!.length === 0) {
								delete draft.activeConversations[roomId].isWritingList;
							}
						}
					} else {
						const newArray = [];
						newArray.push(userId);
						draft.activeConversations[roomId] = { isWritingList: newArray };
					}
				} else if (writingStatus) {
					const newArray = [];
					newArray.push(userId);
					draft.activeConversations[roomId] = { isWritingList: newArray };
				}
			}),
			false,
			'ACTIVE_CONVERSATIONS/SET_IS_WRITING'
		);
	},
	setReferenceMessage: (
		roomId: string,
		referenceMessageId: string,
		senderId: string,
		stanzaId: string,
		actionType: messageActionType,
		attachment?: AttachmentMessageType
	): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId]) {
					draft.activeConversations[roomId].referenceMessage = {
						roomId,
						messageId: referenceMessageId,
						senderId,
						stanzaId,
						actionType,
						attachment
					};
				} else {
					draft.activeConversations[roomId] = {
						referenceMessage: {
							roomId,
							messageId: referenceMessageId,
							senderId,
							stanzaId,
							actionType,
							attachment
						}
					};
				}
			}),
			false,
			'ACTIVE_CONVERSATIONS/SET_REFERENCE_MESSAGE_VIEW'
		);
	},
	unsetReferenceMessage: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId]) {
					delete draft.activeConversations[roomId].referenceMessage;
				}
			}),
			false,
			'ACTIVE_CONVERSATIONS/REMOVE_REFERENCE_MESSAGE_VIEW'
		);
	},
	setPinnedMessage: (roomId: string, message: object) => ({ id: roomId, ms: message }),
	setIdMessageWhereScrollIsStopped: (roomId: string, messageId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId]) {
					draft.activeConversations[roomId].scrollPositionMessageId = messageId;
				} else {
					draft.activeConversations[roomId] = {
						scrollPositionMessageId: messageId
					};
				}
			}),
			false,
			'ACTIVE_CONVERSATIONS/SET_SCROLL_POSITION'
		);
	},
	setDraftMessage: (roomId: string, sended: boolean, message?: string): void => {
		set(
			produce((draft: RootStore) => {
				if (sended) {
					if (draft.activeConversations[roomId]) {
						delete draft.activeConversations[roomId].draftMessage;
					}
				} else if (draft.activeConversations[roomId]) {
					draft.activeConversations[roomId].draftMessage = message;
				} else {
					draft.activeConversations[roomId] = {
						draftMessage: message
					};
				}
			}),
			false,
			'ACTIVE_CONVERSATION/SET_DRAFT_MESSAGE'
		);
	},
	setHistoryIsFullyLoaded: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId]) {
					draft.activeConversations[roomId].isHistoryFullyLoaded = true;
				} else {
					draft.activeConversations[roomId] = {
						isHistoryFullyLoaded: true
					};
				}
			}),
			false,
			'ACTIVE_CONVERSATIONS/SET_HISTORY_FULLY_LOADED'
		);
	},
	setHistoryLoadDisabled: (roomId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId]) {
					draft.activeConversations[roomId].isHistoryLoadDisabled = status;
				} else {
					draft.activeConversations[roomId] = {
						isHistoryLoadDisabled: status
					};
				}
			}),
			false,
			'ACTIVE_CONVERSATIONS/SET_HISTORY_LOAD_DISABLED'
		);
	},
	setActionsAccordionStatus: (roomId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeConversations[roomId]) draft.activeConversations[roomId] = {};
				if (!draft.activeConversations[roomId].infoPanelStatus) {
					draft.activeConversations[roomId].infoPanelStatus = {
						actionsAccordionIsOpened: true,
						participantsAccordionIsOpened: true
					};
				}
				draft.activeConversations[roomId].infoPanelStatus!.actionsAccordionIsOpened = status;
			}),
			false,
			'ACTIVE_CONVERSATIONS/SET_ACTIONS_ACCORDION_STATUS'
		);
	},
	setParticipantsAccordionStatus: (roomId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeConversations[roomId]) draft.activeConversations[roomId] = {};
				if (!draft.activeConversations[roomId].infoPanelStatus) {
					draft.activeConversations[roomId].infoPanelStatus = {
						actionsAccordionIsOpened: true,
						participantsAccordionIsOpened: true
					};
				}
				draft.activeConversations[roomId].infoPanelStatus!.participantsAccordionIsOpened = status;
			}),
			false,
			'ACTIVE_CONVERSATIONS/SET_PARTICIPANTS_ACCORDION_STATUS'
		);
	}
});
