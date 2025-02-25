/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AccountSettingsAttrs } from '@zextras/carbonio-shell-ui/lib/types/account';
import { produce } from 'immer';
import { StateCreator } from 'zustand';

import ChatExporter from '../../settings/components/chatExporter/ChatExporter';
import { AttributesList, ExportStatus } from '../../types/store/SessionTypes';
import { RootStore, SessionStoreSlice } from '../../types/store/StoreTypes';
import { UserType } from '../../types/store/UserTypes';
import UserDataRetriever from '../../utils/UserDataRetriever';

export const useSessionStoreSlice: StateCreator<SessionStoreSlice> = (
	set: (...any: any) => void
) => ({
	session: {
		filterHasFocus: false
	},
	setLoginInfo: (id: string, name: string, displayName?: string, userType?: UserType): void => {
		set(
			produce((draft: RootStore) => {
				draft.session = {
					id,
					name,
					displayName,
					userType: userType ?? UserType.INTERNAL,
					connections: {
						chats_be: undefined,
						xmpp: undefined,
						websocket: undefined
					},
					filterHasFocus: draft.session.filterHasFocus
				};
				UserDataRetriever.getDebouncedUser(id, true);
			}),
			false,
			'SESSION/LOGIN_INFO'
		);
	},
	setSessionId: (sessionId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.session.sessionId = sessionId;
			}),
			false,
			'SESSION/SESSION_ID'
		);
	},
	setAttributes: (attrs: AccountSettingsAttrs): void => {
		set(
			produce((draft: RootStore) => {
				const minutesToNumber = (time: string): number => Number(time.split('m')[0]);
				draft.session.attributes = {
					privateChatCreation: attrs.carbonioWscPrivateChatCreation === 'TRUE',
					groupChatCreation: attrs.carbonioWscGroupChatCreation === 'TRUE',
					maxGroupMembers: Number(attrs.carbonioWscMaxGroupMembers || 0),
					messageDeleteTimeLimit: minutesToNumber(
						(attrs.carbonioWscMessageDeleteTimeLimit as string) || '0m'
					),
					messageEditTimeLimit: minutesToNumber(
						(attrs.carbonioWscMessageEditTimeLimit as string) || '0m'
					),
					maxRoomPictureSize: Number(attrs.carbonioWscMaxRoomPictureSize || 0),
					attachmentUpload: attrs.carbonioWscAttachmentUpload === 'TRUE',
					maxAttachmentSize: Number(attrs.carbonioWscMaxAttachmentSize || 0),
					showMessageReads: attrs.carbonioWscShowMessageReads === 'TRUE',
					showUsersPresence: attrs.carbonioWscShowUsersPresence === 'TRUE',
					videoCallEnabled: attrs.carbonioWscVideoCallEnabled === 'TRUE',
					recordingEnabled: attrs.carbonioWscRecordingEnabled === 'TRUE',
					virtualBackgroundEnabled: attrs.carbonioWscVirtualBackgroundEnabled === 'TRUE'
				} as AttributesList;
			}),
			false,
			'SESSION/SET_ATTRS'
		);
	},
	setSelectedRoomOneToOneGroup: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.session.selectedRoomOneToOneGroup !== roomId) {
					draft.session.selectedRoomOneToOneGroup = roomId;
				}
			}),
			false,
			'SESSION/SET_SELECTED_ROOM_ONE_TO_ONE_GROUP'
		);
	},
	setFilterHasFocus: (hasFocus: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.session.filterHasFocus = hasFocus;
			}),
			false,
			'SESSION/SET_FILTER_FOCUS'
		);
	},
	setCustomLogo: (logo: string | false): void => {
		set(
			produce((draft: RootStore) => {
				draft.session.customLogo = logo;
			}),
			false,
			'SESSION/SET_CUSTOM_LOGO'
		);
	},
	setChatExporting: (roomId?: string): void => {
		set(
			produce((draft: RootStore) => {
				if (roomId) {
					draft.session.chatExporting = {
						roomId,
						exporter: new ChatExporter(roomId),
						status: ExportStatus.EXPORTING
					};
				} else {
					delete draft.session.chatExporting;
				}
			}),
			false,
			'SESSION/SET_CHAT_EXPORTING'
		);
	},
	setChatExportStatus: (status: ExportStatus): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.session.chatExporting) {
					draft.session.chatExporting.status = status;
				}
			}),
			false,
			'SESSION/SET_CHAT_EXPORTING_STATUS'
		);
	}
});
