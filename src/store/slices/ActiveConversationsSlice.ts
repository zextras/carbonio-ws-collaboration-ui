/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { find, findIndex, forEach, orderBy, remove } from 'lodash';
import { StateCreator } from 'zustand';

import { FileToUpload, messageActionType } from '../../types/store/ActiveConversationTypes';
import { AttachmentMessageType, TextMessage } from '../../types/store/MessageTypes';
import { ActiveConversationsSlice, RootStore } from '../../types/store/StoreTypes';

export const useActiveConversationsSlice: StateCreator<ActiveConversationsSlice> = (
	set: (...any: any) => void
) => ({
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
			'AC/SET_INPUT_FOCUS'
		);
	},
	setIsWriting: (roomId: string, userId: string, writingStatus: boolean): void => {
		set(
			produce((draft: RootStore) => {
				// Handle the case when the conversation is not yet in the activeConversations map
				if (!draft.activeConversations[roomId]) draft.activeConversations[roomId] = {};
				if (!draft.activeConversations[roomId].isWritingList)
					draft.activeConversations[roomId].isWritingList = [];

				const isUserYetInWritingList = find(
					draft.activeConversations[roomId].isWritingList,
					(id) => id === userId
				);

				// If a new user starts writing add it to the list
				if (writingStatus && !isUserYetInWritingList) {
					draft.activeConversations[roomId].isWritingList = [
						...(draft.activeConversations[roomId].isWritingList || []),
						userId
					];
				}

				// If a user stops writing remove it from the list
				if (!writingStatus && isUserYetInWritingList) {
					remove(draft.activeConversations[roomId].isWritingList!, (id) => id === userId);
					if (draft.activeConversations[roomId].isWritingList!.length === 0) {
						delete draft.activeConversations[roomId].isWritingList;
					}
				}
			}),
			false,
			'AC/SET_IS_WRITING'
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
			'AC/SET_REFERENCE_MESSAGE_VIEW'
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
			'AC/REMOVE_REFERENCE_MESSAGE_VIEW'
		);
	},
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
			'AC/SET_SCROLL_POSITION'
		);
	},
	setDraftMessage: (roomId: string, sent: boolean, message?: string): void => {
		set(
			produce((draft: RootStore) => {
				if (sent) {
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
			'AC/SET_DRAFT_MESSAGE'
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
					// we set as active a different file only if the one we are removing is the selected one
					// before to remove the file, we set as selected the once who comes after if present otherwise the previous one
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

						if (draft.activeConversations[roomId].filesToAttach![fileToRemoveIdx + 1]) {
							draft.activeConversations[roomId].filesToAttach![fileToRemoveIdx + 1].hasFocus = true;
							if (
								draft.activeConversations[roomId].filesToAttach![fileToRemoveIdx + 1].description
							) {
								draft.activeConversations[roomId].draftMessage =
									draft.activeConversations[roomId].filesToAttach![fileToRemoveIdx + 1].description;
							}
						} else if (draft.activeConversations[roomId].filesToAttach![fileToRemoveIdx - 1]) {
							draft.activeConversations[roomId].filesToAttach![fileToRemoveIdx - 1].hasFocus = true;
							if (
								draft.activeConversations[roomId].filesToAttach![fileToRemoveIdx - 1].description
							) {
								draft.activeConversations[roomId].draftMessage =
									draft.activeConversations[roomId].filesToAttach![fileToRemoveIdx - 1].description;
							}
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
	}
});
