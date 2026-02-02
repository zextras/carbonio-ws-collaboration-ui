/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { concat, find, findIndex, includes, orderBy, remove, reverse, size } from 'lodash';
import { StateCreator } from 'zustand';

import {
	ActiveConversation,
	ActiveConversationsSlice,
	FileToUpload,
	messageActionType
} from '../../types/store/ActiveConversationTypes';
import {
	AttachmentMessageType,
	MessageType,
	TextMessage
} from '../../types/store/ChatsRegistryTypes';
import { RootStore } from '../../types/store/StoreTypes';

const initActiveConversation = (draft: RootStore, roomId: string): ActiveConversation => {
	if (!draft.activeConversations[roomId]) {
		draft.activeConversations[roomId] = {
			infoPanelStatus: {
				actionsAccordionIsOpened: true,
				participantsAccordionIsOpened: true
			}
		};
	}
	return draft.activeConversations[roomId];
};

export const useActiveConversationsSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	ActiveConversationsSlice
> = (set) => ({
	activeConversations: {},
	setScrollPosition: (roomId: string, messageId: string): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.scrollPositionMessageId = messageId;
			}),
			false,
			'AC/SET_SCROLL_POSITION'
		);
	},
	setInputHasFocus: (roomId: string, hasFocus: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.inputHasFocus = hasFocus;

				// Remove newReactions
				if (hasFocus && conversation.newReactions) {
					delete conversation.newReactions;
				}
			}),
			false,
			'AC/SET_INPUT_FOCUS'
		);
	},
	setIsWriting: (roomId: string, userId: string, writingStatus: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				if (!conversation.isWritingList) conversation.isWritingList = [];

				const alreadyWriting = includes(conversation.isWritingList, userId);

				// If a new user starts writing, add him to the list
				if (writingStatus && !alreadyWriting) {
					conversation.isWritingList.push(userId);
				}

				// If a user stops writing, remove him from the list
				if (!writingStatus && alreadyWriting) {
					remove(conversation.isWritingList, (id) => id === userId);
				}
			}),
			false,
			'AC/SET_IS_WRITING'
		);
	},
	setReferenceMessage: (
		roomId: string,
		reference: {
			messageId: string;
			senderId: string;
			stanzaId: string;
			actionType: messageActionType;
			attachment?: AttachmentMessageType;
		}
	): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.referenceMessage = {
					roomId,
					...reference
				};
			}),
			false,
			'AC/SET_REFERENCE_MESSAGE'
		);
	},
	unsetReferenceMessage: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				delete conversation.referenceMessage;
			}),
			false,
			'AC/UNSET_REFERENCE_MESSAGE'
		);
	},
	setDraftMessage: (roomId: string, message?: string): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				if (!message) delete conversation.draftMessage;
				else if (message !== conversation.draftMessage?.text) {
					conversation.draftMessage = {
						text: message,
						date: Date.now()
					};
				}
			}),
			false,
			'AC/SET_DRAFT_MESSAGE'
		);
	},
	setHistoryIsFullyLoaded: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.isHistoryFullyLoaded = true;
			}),
			false,
			'AC/SET_HISTORY_FULLY_LOADED'
		);
	},
	setHistoryLoadDisabled: (roomId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.isHistoryLoadDisabled = status;
			}),
			false,
			'AC/SET_HISTORY_LOAD_DISABLED'
		);
	},
	setActionsAccordionStatus: (roomId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.infoPanelStatus.actionsAccordionIsOpened = status;
			}),
			false,
			'AC/SET_ACTIONS_ACCORDION_STATUS'
		);
	},
	setParticipantsAccordionStatus: (roomId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.infoPanelStatus.participantsAccordionIsOpened = status;
			}),
			false,
			'AC/SET_PARTICIPANTS_ACCORDION_STATUS'
		);
	},
	addFilesToAttach: (roomId: string, files: FileToUpload[]): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				if (!conversation.filesToAttach) conversation.filesToAttach = [];
				conversation.filesToAttach = concat(conversation.filesToAttach, files);
			}),
			false,
			'AC/ADD_FILES_TO_ATTACH'
		);
	},
	removeFilesToAttach: (roomId: string, fileId?: string): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				if (!conversation.filesToAttach) return;
				if (!fileId) {
					delete conversation.filesToAttach;
					return;
				}

				const indexFileToRemove = findIndex(
					conversation.filesToAttach,
					(file) => file.fileId === fileId
				);
				if (indexFileToRemove !== -1) {
					// Determine next file to focus
					const nextFile =
						conversation.filesToAttach[indexFileToRemove + 1] ||
						conversation.filesToAttach[indexFileToRemove - 1];
					if (nextFile) {
						nextFile.hasFocus = true;
					}
				}
				remove(conversation.filesToAttach, (file) => file.fileId === fileId);
			}),
			false,
			'AC/REMOVE_FILE_TO_ATTACH'
		);
	},
	setFileFocus: (roomId: string, fileId: string, active: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const { filesToAttach } = initActiveConversation(draft, roomId);
				if (filesToAttach) {
					filesToAttach.forEach((file) => {
						file.hasFocus = file.fileId === fileId ? active : false;
					});
				}
			}),
			false,
			'AC/SET_FILE_FOCUS'
		);
	},
	setFileDescription: (roomId: string, fileId: string | undefined, description?: string): void => {
		set(
			produce((draft: RootStore) => {
				const { filesToAttach } = initActiveConversation(draft, roomId);
				if (filesToAttach) {
					if (!fileId && filesToAttach.length > 0 && filesToAttach[0].hasFocus) {
						filesToAttach[0].description = description ?? '';
						return;
					}
					const fileToAttach = find(filesToAttach, (file) => file.fileId === fileId);
					if (fileToAttach) {
						fileToAttach.description = description ?? '';
					}
				}
			}),
			false,
			'AC/SET_FILE_DESCRIPTION'
		);
	},
	setForwardMessageList: (roomId: string, message: TextMessage): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				if (conversation.forwardMessageList) {
					conversation.forwardMessageList = orderBy(
						[...conversation.forwardMessageList, message],
						['date'],
						['asc']
					);
				} else {
					conversation.forwardMessageList = [message];
				}
			}),
			false,
			'AC/SET_FORWARD_MODE'
		);
	},
	unsetForwardMessageList: (roomId: string, message?: TextMessage): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				if (conversation.forwardMessageList) {
					if (message) {
						remove(conversation.forwardMessageList, (element) => element.id === message.id);
					}
					if (!message || size(conversation.forwardMessageList) === 0) {
						delete conversation.forwardMessageList;
					}
				}
			}),
			false,
			'AC/UNSET_FORWARD_MESSAGE_LIST'
		);
	},
	setNewReaction(roomId: string, stanzaId: string, reaction: string, from: string): void {
		set(
			produce((draft: RootStore) => {
				// Ignore reactions to messages that are not mine
				if (
					!find(
						draft.chatsRegistry[roomId]?.messages,
						(message) =>
							message.type === MessageType.TEXT_MSG &&
							message.stanzaId === stanzaId &&
							message.from === draft.session.id
					)
				)
					return;

				const conversation = initActiveConversation(draft, roomId);
				const reactions = conversation.newReactions || [];

				if (reaction === '') {
					const reactionToRemove = find(
						reverse(draft.chatsRegistry[roomId]?.fastenings?.[stanzaId]),
						(fastening) =>
							fastening.action === 'reaction' && fastening.from === from && fastening.value !== ''
					);
					const index = findIndex(
						reactions,
						(r) => r.reaction === reactionToRemove?.value && r.stanzaId === stanzaId
					);
					if (index !== -1) {
						reactions.splice(index, 1);
					}
				} else {
					reactions.push({
						stanzaId,
						reaction
					});
				}
				conversation.newReactions = reactions;
			}),
			false,
			'AC/SET_NEW_REACTION'
		);
	},
	unsetNewReactions(roomId: string): void {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				if (conversation.newReactions) {
					delete conversation.newReactions;
				}
			}),
			false,
			'AC/UNSET_NEW_REACTIONS'
		);
	},
	setSelectedSearchResult(roomId: string, stanzaId: string | undefined): void {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.selectedSearchResult = stanzaId;
				if (stanzaId) {
					conversation.selectedPinnedMessage = undefined;
				}
			}),
			false,
			'AC/SET_SELECTED_SEARCH_RESULT'
		);
	},
	setPinnedMessage: (roomId: string, message: TextMessage): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.messagePinned = message;
			}),
			false,
			'AC/SET_PINNED_MESSAGE'
		);
	},
	removePinnedMessage: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				delete conversation.messagePinned;
			}),
			false,
			'AC/REMOVE_PINNED_MESSAGE'
		);
	},
	setSelectedPinnedMessage: (roomId: string, stanzaId: string | undefined): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				conversation.selectedPinnedMessage = stanzaId;
				if (stanzaId !== undefined) {
					conversation.selectedSearchResult = undefined;
				}
			}),
			false,
			'AC/SET_SELECTED_PINNED_MESSAGE'
		);
	}
});
