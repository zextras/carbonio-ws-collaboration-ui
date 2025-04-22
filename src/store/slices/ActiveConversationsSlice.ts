/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { find, findIndex, forEach, includes, orderBy, remove, reverse } from 'lodash';
import { StateCreator } from 'zustand';

import {
	ActiveConversation,
	ActiveConversationsSlice,
	FileToUpload,
	messageActionType
} from '../../types/store/ActiveConversationTypes';
import {
	AttachmentMessageType,
	Message,
	MessageType,
	TextMessage
} from '../../types/store/ChatsRegistryTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { isBefore } from '../../utils/dateUtils';

const initActiveConversation = (draft: RootStore, roomId: string): ActiveConversation => {
	if (!draft.activeConversations[roomId]) {
		draft.activeConversations[roomId] = {};
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
			'AC/REMOVE_REFERENCE_MESSAGE'
		);
	},
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
	setDraftMessage: (roomId: string, message?: string): void => {
		set(
			produce((draft: RootStore) => {
				const conversation = initActiveConversation(draft, roomId);
				if (message) conversation.draftMessage = message;
				else delete conversation.draftMessage;
			}),
			false,
			'AC/SET_DRAFT_MESSAGE'
		);
	},
	setLastMamMessage: (message: Message): void => {
		set(
			produce((draft: RootStore) => {
				const lastMamDate = draft.activeConversations[message.roomId]?.lastMamMessage?.date;
				if (!lastMamDate || isBefore(message.date, lastMamDate)) {
					draft.activeConversations[message.roomId] = {
						...draft.activeConversations[message.roomId],
						lastMamMessage: message
					};
				}
			}),
			false,
			'AC/SET_LAST_MAM_MESSAGE_ID'
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
			'AC/SET_HISTORY_FULLY_LOADED'
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
			'AC/SET_HISTORY_LOAD_DISABLED'
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
			'AC/SET_ACTIONS_ACCORDION_STATUS'
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
			'AC/SET_PARTICIPANTS_ACCORDION_STATUS'
		);
	},
	setFilesToAttach: (roomId: string, files: FileToUpload[]): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeConversations[roomId]) draft.activeConversations[roomId] = {};
				if (!draft.activeConversations[roomId].filesToAttach) {
					draft.activeConversations[roomId].filesToAttach = files;
				} else {
					draft.activeConversations[roomId].filesToAttach = [
						...draft.activeConversations[roomId].filesToAttach!,
						...files
					];
				}
			}),
			false,
			'AC/SET_FILES_TO_ATTACH'
		);
	},
	setFileFocusedToModify: (roomId: string, fileTempId: string, active: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId].filesToAttach) {
					forEach(draft.activeConversations[roomId].filesToAttach, (file) => {
						if (file.fileId === fileTempId) {
							file.hasFocus = active;
						} else {
							file.hasFocus = false;
						}
					});
				}
			}),
			false,
			'AC/SET_FILE_FOCUSED'
		);
	},
	addDescriptionToFileToAttach: (roomId: string, fileTempId: string, description: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId].filesToAttach) {
					forEach(draft.activeConversations[roomId].filesToAttach, (file) => {
						if (file.fileId === fileTempId) {
							file.description = description;
							file.hasFocus = false;
						}
					});
				}
			}),
			false,
			'AC/ADD_DESC_FILE_TO_ATTACH'
		);
	},
	removeDescriptionToFileToAttach: (roomId: string, fileTempId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId].filesToAttach) {
					forEach(draft.activeConversations[roomId].filesToAttach, (file) => {
						if (file.fileId === fileTempId) file.description = '';
					});
				}
			}),
			false,
			'AC/REMOVE_DESC_FILE_TO_ATTACH'
		);
	},
	removeFileToAttach: (roomId: string, fileTempId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId].filesToAttach) {
					// We set as active a different file only if the one we are removing is the selected one.
					// Before remove the file, we set as selected the one who comes after if present, otherwise the previous one
					const fileToRemoveIsSelected = find(
						draft.activeConversations[roomId].filesToAttach,
						(file) => file.fileId === fileTempId && file.hasFocus
					);

					if (fileToRemoveIsSelected) {
						const fileToRemoveIdx = findIndex(draft.activeConversations[roomId].filesToAttach, [
							'fileId',
							fileTempId
						]);

						forEach(draft.activeConversations[roomId].filesToAttach, (file) => {
							file.hasFocus = false;
						});

						const { filesToAttach } = draft.activeConversations[roomId];

						const fileIdxToUse =
							(filesToAttach![fileToRemoveIdx + 1] && fileToRemoveIdx + 1) ||
							(filesToAttach![fileToRemoveIdx - 1] && fileToRemoveIdx - 1);

						draft.activeConversations[roomId].filesToAttach![fileIdxToUse].hasFocus = true;
						if (draft.activeConversations[roomId].filesToAttach![fileIdxToUse].description) {
							draft.activeConversations[roomId].draftMessage =
								draft.activeConversations[roomId].filesToAttach![fileIdxToUse].description;
						}
					}

					remove(
						draft.activeConversations[roomId].filesToAttach!,
						(file) => file.fileId === fileTempId
					);
				}
			}),
			false,
			'AC/REMOVE_FILE_TO_ATTACH'
		);
	},
	unsetFilesToAttach: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId]) {
					delete draft.activeConversations[roomId].filesToAttach;
				}
			}),
			false,
			'AC/UNSET_FILES_TO_ATTACH'
		);
	},
	setForwardMessageList: (roomId: string, message: TextMessage): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeConversations[roomId]) draft.activeConversations[roomId] = {};
				if (draft.activeConversations[roomId].forwardMessageList) {
					draft.activeConversations[roomId].forwardMessageList = orderBy(
						[...draft.activeConversations[roomId].forwardMessageList!, message],
						['date'],
						['asc']
					);
				} else {
					draft.activeConversations[roomId].forwardMessageList = [message];
				}
			}),
			false,
			'AC/SET_FORWARD_MODE'
		);
	},
	unsetForwardMessageList: (roomId: string, message?: TextMessage): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeConversations[roomId].forwardMessageList) {
					if (message) {
						remove(
							draft.activeConversations[roomId].forwardMessageList!,
							(element) => element.id === message.id
						);
						if (draft.activeConversations[roomId].forwardMessageList?.length === 0) {
							delete draft.activeConversations[roomId].forwardMessageList;
						}
					} else {
						delete draft.activeConversations[roomId].forwardMessageList;
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
						draft.chatsRegistry[roomId].messages,
						(message) =>
							message.type === MessageType.TEXT_MSG &&
							message.stanzaId === stanzaId &&
							message.from === draft.session.id
					)
				)
					return;

				if (!draft.activeConversations[roomId]) draft.activeConversations[roomId] = {};
				const reactions = draft.activeConversations[roomId].newReactions || [];

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
				draft.activeConversations[roomId].newReactions = reactions;
			}),
			false,
			'AC/SET_NEW_REACTION'
		);
	}
});
