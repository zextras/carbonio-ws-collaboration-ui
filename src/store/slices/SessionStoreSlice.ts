/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import { CapabilityList } from '../../types/store/SessionTypes';
import { RootStore, SessionStoreSlice } from '../../types/store/StoreTypes';

export const useSessionStoreSlice = (set: (...any: any) => void): SessionStoreSlice => ({
	session: {
		userPrefTimeZone: '',
		filterHasFocus: false
	},
	setLoginInfo: (id: string, name: string, displayName?: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.session = {
					id,
					name,
					displayName,
					connections: {
						chats_be: undefined,
						xmpp: undefined,
						websocket: undefined
					},
					userPrefTimeZone: draft.session.userPrefTimeZone,
					filterHasFocus: draft.session.filterHasFocus
				};
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
	setCapabilities: (capabilities: CapabilityList): void => {
		set(
			produce((draft: RootStore) => {
				draft.session.capabilities = capabilities;
			}),
			false,
			'SESSION/SET_CAPABILITIES'
		);
	},
	setSelectedRoomOneToOneGroup: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.session && draft.session?.selectedRoomOneToOneGroup !== roomId) {
					draft.session.selectedRoomOneToOneGroup = roomId;
				}
			}),
			false,
			'SESSION/SET_SELECTED_ROOM_ONE_TO_ONE_GROUP'
		);
	},
	setUserPrefTimezone: (timezoneId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.session.userPrefTimeZone = timezoneId;
			}),
			false,
			'SESSION/SET_USER_PREF_TIMEZONE'
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
	}
});
