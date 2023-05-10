/* eslint-disable prettier/prettier */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map } from 'lodash';

import { FileToUpload, ReferenceMessage } from '../../types/store/ActiveConversationTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getRoomIsWritingList = (store: RootStore, id: string): string[] | undefined =>
	store.activeConversations[id]?.isWritingList
		? map(store.activeConversations[id]?.isWritingList, (userId) =>
				store.users[userId]?.name || store.users[userId]?.email || ''
		  )
		: store.activeConversations[id]?.isWritingList;

export const getReferenceMessage = (
	store: RootStore,
	roomId: string
): ReferenceMessage | undefined => store.activeConversations[roomId]?.referenceMessage;

export const getIdMessageWhereScrollIsStopped = (
	store: RootStore,
	roomId: string
): string | undefined => store.activeConversations[roomId]?.scrollPositionMessageId;

export const getHistoryIsFullyLoaded = (
	store: RootStore,
	roomId: string
): boolean | undefined => store.activeConversations[roomId]?.isHistoryFullyLoaded;

export const getHistoryIsLoadedDisabled = (
	store: RootStore,
	roomId: string
): boolean | undefined => store.activeConversations[roomId]?.isHistoryLoadDisabled;

export const getInputHasFocus = (
	store: RootStore,
	roomId: string
): boolean | undefined => store.activeConversations[roomId]?.inputHasFocus;

export const getActionsAccordionStatus = (
	store: RootStore,
	roomId: string
): boolean => {
	if (store.activeConversations[roomId]?.infoPanelStatus)
		return store.activeConversations[roomId].infoPanelStatus!.actionsAccordionIsOpened;
	return true;
};

export const getParticipantsAccordionStatus = (
	store: RootStore,
	roomId: string
): boolean => {
	if (store.activeConversations[roomId]?.infoPanelStatus)
		return store.activeConversations[roomId].infoPanelStatus!.participantsAccordionIsOpened;
	return true;
};

export const getDraftMessage = (
	store: RootStore,
	roomId: string
): string | undefined => store.activeConversations[roomId] ? store.activeConversations[roomId]?.draftMessage : '';

export const getFilesToUploadArray = (
	store: RootStore,
	roomId: string
): FileToUpload[] | undefined => store.activeConversations[roomId]?.filesToAttach;
