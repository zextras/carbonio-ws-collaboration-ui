/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { StateCreator } from 'zustand';

import BidirectionalConnectionAudioInOut from '../../network/webRTC/BidirectionalConnectionAudioInOut';
import ScreenOutConnection from '../../network/webRTC/ScreenOutConnection';
import VideoOutConnection from '../../network/webRTC/VideoOutConnection';
import VideoScreenInConnection from '../../network/webRTC/VideoScreenInConnection';
import {
	MeetingChatVisibility,
	MeetingViewType,
	STREAM_TYPE,
	StreamsSubscriptionMap,
	Subscription,
	TileData
} from '../../types/store/ActiveMeetingTypes';
import { ActiveMeetingSlice, RootStore } from '../../types/store/StoreTypes';

export const useActiveMeetingSlice: StateCreator<ActiveMeetingSlice> = (
	set: (...any: any) => void
) => ({
	activeMeeting: {},
	meetingConnection: (
		meetingId: string,
		audioStreamEnabled: boolean,
		selectedAudioDeviceId: string | undefined,
		videoStreamEnabled: boolean,
		selectedVideoDeviceId?: string | undefined
	): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId] = {
					// Default graphic values
					sidebarStatus: {
						sidebarIsOpened: true,
						actionsAccordionIsOpened: true,
						participantsAccordionIsOpened: false,
						waitingListAccordionIsOpened: true,
						recordingAccordionIsOpened: false
					},
					chatVisibility: MeetingChatVisibility.CLOSED,
					meetingViewSelected: MeetingViewType.GRID,
					isCarouselVisible: true,
					// Peer connections
					localStreams: {
						selectedAudioDeviceId,
						selectedVideoDeviceId
					},
					bidirectionalAudioConn: new BidirectionalConnectionAudioInOut(
						meetingId,
						audioStreamEnabled,
						selectedAudioDeviceId
					),
					videoScreenIn: new VideoScreenInConnection(meetingId),
					videoOutConn: new VideoOutConnection(
						meetingId,
						videoStreamEnabled,
						selectedVideoDeviceId
					),
					screenOutConn: new ScreenOutConnection(meetingId),
					subscription: {},
					talkingUsers: []
				};
			}),
			false,
			'AM/MEETING_CONNECTION'
		);
	},
	meetingDisconnection: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.bidirectionalAudioConn?.closePeerConnection();
				draft.activeMeeting[meetingId]?.videoScreenIn?.closePeerConnection();
				draft.activeMeeting[meetingId]?.videoOutConn?.closePeerConnection();
				draft.activeMeeting[meetingId]?.screenOutConn?.closePeerConnection();
				delete draft.activeMeeting[meetingId];
			}),
			false,
			'AM/MEETING_DISCONNECTION'
		);
	},
	setMeetingSidebarStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.sidebarIsOpened = status;
				}
			}),
			false,
			'AM/SET_MEETING_SIDEBAR_STATUS'
		);
	},
	setMeetingActionsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.actionsAccordionIsOpened = status;
				}
			}),
			false,
			'AM/SET_MEETING_ACTIONS_ACCORDION_STATUS'
		);
	},
	setWaitingListAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.waitingListAccordionIsOpened = status;
				}
			}),
			false,
			'AM/SET_WAITING_LIST_ACCORDION_STATUS'
		);
	},
	setRecordingAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.recordingAccordionIsOpened = status;
				}
			}),
			false,
			'AM/SET_RECORDING_ACCORDION_STATUS'
		);
	},
	setMeetingParticipantsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.participantsAccordionIsOpened = status;
				}
			}),
			false,
			'AM/SET_MEETING_PARTICIPANTS_ACCORDION_STATUS'
		);
	},
	setMeetingChatVisibility: (meetingId: string, visibilityStatus: MeetingChatVisibility): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].chatVisibility = visibilityStatus;
				}
			}),
			false,
			'AM/SET_CHAT_VIEW'
		);
	},
	setMeetingViewSelected: (meetingId: string, viewType: MeetingViewType): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].meetingViewSelected = viewType;

					// Unset pin when switching to grid view
					if (viewType === MeetingViewType.GRID) {
						draft.activeMeeting[meetingId].pinnedTile = undefined;
					}
				}
			}),
			false,
			'AM/SET_VIEW_TYPE'
		);
	},
	setLocalStreams: (meetingId: string, streamType: STREAM_TYPE, stream: MediaStream): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId].localStreams = {
					...draft.activeMeeting[meetingId].localStreams,
					[streamType]: stream
				};
			}),
			false,
			'AM/SET_LOCAL_STREAM'
		);
	},
	removeLocalStreams: (meetingId: string, streamType: STREAM_TYPE): void => {
		set(
			produce((draft: RootStore) => {
				if (streamType === STREAM_TYPE.VIDEO || streamType === STREAM_TYPE.SCREEN) {
					draft.activeMeeting[meetingId]?.localStreams?.[streamType]
						?.getTracks()
						.forEach((track) => track.stop());
				}
				delete draft.activeMeeting[meetingId].localStreams![streamType];
			}),
			false,
			'AM/SET_LOCAL_STREAM'
		);
	},
	setSelectedDeviceId: (meetingId: string, streamType: STREAM_TYPE, deviceId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting[meetingId]?.localStreams) {
					if (streamType === STREAM_TYPE.AUDIO) {
						draft.activeMeeting[meetingId].localStreams = {
							...draft.activeMeeting[meetingId].localStreams,
							selectedAudioDeviceId: deviceId
						};
					} else {
						draft.activeMeeting[meetingId].localStreams = {
							...draft.activeMeeting[meetingId].localStreams,
							selectedVideoDeviceId: deviceId
						};
					}
				} else {
					draft.activeMeeting[meetingId].localStreams = {
						...draft.activeMeeting[meetingId].localStreams,
						[streamType === STREAM_TYPE.AUDIO ? 'selectedAudioDeviceId' : 'selectedVideoDeviceId']:
							deviceId
					};
				}
			}),
			false,
			'AM/SET_SELECTED_DEVICE_ID'
		);
	},
	setSubscribedTracks: (meetingId: string, streams: StreamsSubscriptionMap): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId].subscription = streams;
			}),
			false,
			'AM/SET_SUBSCRIPTION'
		);
	},
	setTalkingUser: (meetingId: string, userId: string, isTalking: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (isTalking) {
					// If flag is true, add the ID to the array if it's not already present
					if (!draft.activeMeeting[meetingId].talkingUsers.includes(userId)) {
						draft.activeMeeting[meetingId].talkingUsers.push(userId);
					}
				} else {
					// If flag is false, remove the ID from the array if it's present
					const index = draft.activeMeeting[meetingId]?.talkingUsers.indexOf(userId);
					if (index !== -1) {
						draft.activeMeeting[meetingId]?.talkingUsers?.splice(index, 1);
					}
				}
			}),
			false,
			'AM/SET_IS_TALKING'
		);
	},
	setIsCarouseVisible: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].isCarouselVisible = status;
				}
			}),
			false,
			'AM/SET_MEETING_CAROUSEL_VISIBILITY'
		);
	},
	setPinnedTile: (meetingId: string, tile: TileData | undefined): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					// Switch back to the previous view
					const previousViewType = draft.activeMeeting[meetingId].pinnedTile?.previousViewType;
					if (previousViewType) {
						draft.activeMeeting[meetingId].meetingViewSelected = previousViewType;
					}

					draft.activeMeeting[meetingId].pinnedTile = tile;

					// Pin a tile from GRID view the view to switch to CINEMA and set previousViewType to GRID
					if (tile && draft.activeMeeting[meetingId].meetingViewSelected === MeetingViewType.GRID) {
						// Set the view to switch to CINEMA
						draft.activeMeeting[meetingId].meetingViewSelected = MeetingViewType.CINEMA;
						// Set the previous view to GRID to switch back to it when unpinning
						draft.activeMeeting[meetingId].pinnedTile = {
							...tile,
							previousViewType: MeetingViewType.GRID
						};
					}
				}
			}),
			false,
			'AM/SET_PINNED_TILE'
		);
	},
	setRemoveSubscription: (meetingId: string, subToRemove: Subscription): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.videoScreenIn?.subscriptionManager.removeSubscription(
					subToRemove
				);
			}),
			false,
			'AM/REMOVE_SUB'
		);
	},
	setAddSubscription: (meetingId: string, subToAdd: Subscription): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.videoScreenIn?.subscriptionManager.addSubscription(
					subToAdd
				);
			}),
			false,
			'AM/ADD_SUB'
		);
	},
	setUpdateSubscription: (meetingId: string, subsToRequest: Subscription[]): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.videoScreenIn?.subscriptionManager.updateSubscription(
					subsToRequest
				);
			}),
			false,
			'AM/UPDATE_SUB'
		);
	},
	setDeleteSubscription: (meetingId: string, subIdToDelete: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.videoScreenIn?.subscriptionManager.deleteSubscription(
					subIdToDelete
				);
				draft.activeMeeting[meetingId]?.videoScreenIn?.removeStream(subIdToDelete);
			}),
			false,
			'AM/DELETE_SUB'
		);
	}
});
