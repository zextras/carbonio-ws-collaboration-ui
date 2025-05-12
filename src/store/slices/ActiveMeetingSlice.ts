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
	ActiveMeetingSlice,
	MeetingChatVisibility,
	MeetingAccordionType,
	MeetingViewType,
	STREAM_TYPE,
	StreamsSubscriptionMap,
	Subscription,
	TileData,
	VirtualBackgroundType
} from '../../types/store/ActiveMeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

const isCurrentMeeting = (store: RootStore, meetingId: string): boolean =>
	meetingId === store.activeMeeting?.meetingId;

export const useActiveMeetingSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	ActiveMeetingSlice
> = (set) => ({
	activeMeeting: undefined,
	meetingConnection: (
		meetingId: string,
		audioStream?: {
			enabled: boolean;
			selectedDeviceId?: string;
		},
		videoStream?: {
			enabled: boolean;
			selectedDeviceId?: string;
		}
	): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting = {
					meetingId,
					// Default graphic values
					sidebarStatus: {
						[MeetingAccordionType.GENERAL]: true,
						[MeetingAccordionType.PARTICIPANTS]: false,
						[MeetingAccordionType.WAITING_LIST]: true,
						[MeetingAccordionType.RECORDING]: false,
						[MeetingAccordionType.VISUAL_EFFECTS]: false,
						[MeetingAccordionType.RAISE_HAND]: true
					},
					chatVisibility: MeetingChatVisibility.OPEN,
					meetingViewSelected: MeetingViewType.GRID,
					isCarouselVisible: true,
					// Peer connections
					localStreams: {
						selectedAudioDeviceId: audioStream?.selectedDeviceId,
						selectedVideoDeviceId: videoStream?.selectedDeviceId
					},
					bidirectionalAudioConn: new BidirectionalConnectionAudioInOut(
						meetingId,
						audioStream?.enabled || false,
						audioStream?.selectedDeviceId
					),
					videoScreenIn: new VideoScreenInConnection(meetingId),
					videoOutConn: new VideoOutConnection(
						meetingId,
						videoStream?.enabled || false,
						videoStream?.selectedDeviceId
					),
					virtualBackground: {
						backgroundImage: VirtualBackgroundType.NONE
					},
					screenOutConn: new ScreenOutConnection(meetingId),
					subscription: {},
					talkingUsers: [],
					usersWithHandRaised: []
				};
			}),
			false,
			'AM/MEETING_CONNECTION'
		);
	},
	meetingDisconnection: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.bidirectionalAudioConn?.closePeerConnection();
				draft.activeMeeting.videoScreenIn?.closePeerConnection();
				draft.activeMeeting.videoOutConn?.closePeerConnection();
				draft.activeMeeting.screenOutConn?.closePeerConnection();
				draft.activeMeeting = undefined;
			}),
			false,
			'AM/MEETING_DISCONNECTION'
		);
	},
	setLocalStreams: (meetingId: string, streamType: STREAM_TYPE, stream: MediaStream): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.localStreams = {
					...draft.activeMeeting.localStreams,
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
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				if (streamType === STREAM_TYPE.VIDEO || streamType === STREAM_TYPE.SCREEN) {
					draft.activeMeeting?.localStreams?.[streamType]
						?.getTracks()
						.forEach((track) => track.stop());
				}
				delete draft.activeMeeting.localStreams![streamType];
			}),
			false,
			'AM/SET_LOCAL_STREAM'
		);
	},
	setMeetingSidebarStatus: (accordionType: MeetingAccordionType, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.sidebarStatus[accordionType] = status;
			}),
			false,
			'AM/SET_MEETING_SIDEBAR_STATUS'
		);
	},
	setMeetingChatVisibility: (visibilityStatus: MeetingChatVisibility): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.chatVisibility = visibilityStatus;
			}),
			false,
			'AM/SET_CHAT_VIEW'
		);
	},
	setMeetingViewSelected: (viewType: MeetingViewType): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.meetingViewSelected = viewType;

				// Unset pin when switching to grid view
				if (viewType === MeetingViewType.GRID) {
					draft.activeMeeting.pinnedTile = undefined;
				}
			}),
			false,
			'AM/SET_VIEW_TYPE'
		);
	},
	setSelectedDeviceId: (meetingId: string, streamType: STREAM_TYPE, deviceId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				if (!draft.activeMeeting?.localStreams) {
					if (streamType === STREAM_TYPE.AUDIO) {
						draft.activeMeeting.localStreams = {
							...draft.activeMeeting.localStreams,
							selectedAudioDeviceId: deviceId
						};
					} else {
						draft.activeMeeting.localStreams = {
							...draft.activeMeeting.localStreams,
							selectedVideoDeviceId: deviceId
						};
					}
				} else {
					draft.activeMeeting.localStreams = {
						...draft.activeMeeting.localStreams,
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
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.subscription = streams;
			}),
			false,
			'AM/SET_SUBSCRIPTION'
		);
	},
	setTalkingUser: (meetingId: string, userId: string, isTalking: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				if (isTalking) {
					// If flag is true, add the ID to the array if it's not already present
					if (!draft.activeMeeting.talkingUsers.includes(userId)) {
						draft.activeMeeting.talkingUsers.push(userId);
					}
				} else {
					// If flag is false, remove the ID from the array if it's present
					const index = draft.activeMeeting.talkingUsers.indexOf(userId);
					if (index !== -1) {
						draft.activeMeeting.talkingUsers?.splice(index, 1);
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
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.isCarouselVisible = status;
			}),
			false,
			'AM/SET_MEETING_CAROUSEL_VISIBILITY'
		);
	},
	setPinnedTile: (meetingId: string, tile: TileData | undefined): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				// Switch back to the previous view
				const previousViewType = draft.activeMeeting.pinnedTile?.previousViewType;
				if (previousViewType) {
					draft.activeMeeting.meetingViewSelected = previousViewType;
				}

				draft.activeMeeting.pinnedTile = tile;

				// Pin a tile from GRID view the view to switch to CINEMA and set previousViewType to GRID
				if (tile && draft.activeMeeting.meetingViewSelected === MeetingViewType.GRID) {
					// Set the view to switch to CINEMA
					draft.activeMeeting.meetingViewSelected = MeetingViewType.CINEMA;
					// Set the previous view to GRID to switch back to it when unpinning
					draft.activeMeeting.pinnedTile = {
						...tile,
						previousViewType: MeetingViewType.GRID
					};
				}
			}),
			false,
			'AM/SET_PINNED_TILE'
		);
	},
	setRemoveSubscription: (meetingId: string, subToRemove: Subscription): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.videoScreenIn?.subscriptionManager?.removeSubscription(subToRemove);
				delete draft.activeMeeting.subscription[`${subToRemove.userId}-${subToRemove.type}`];
			}),
			false,
			'AM/REMOVE_SUB'
		);
	},
	setAddSubscription: (meetingId: string, subToAdd: Subscription): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.videoScreenIn?.subscriptionManager?.addSubscription(subToAdd);
			}),
			false,
			'AM/ADD_SUB'
		);
	},
	setUpdateSubscription: (meetingId: string, subsToRequest: Subscription[]): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.videoScreenIn?.subscriptionManager?.updateSubscription(subsToRequest);
			}),
			false,
			'AM/UPDATE_SUB'
		);
	},
	setDeleteSubscription: (
		meetingId: string,
		subIdToDelete: string,
		streamType: STREAM_TYPE[]
	): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.videoScreenIn?.subscriptionManager?.deleteSubscription(
					subIdToDelete,
					streamType
				);
				draft.activeMeeting.videoScreenIn?.removeStream(subIdToDelete, streamType);
				delete draft.activeMeeting.subscription[`${subIdToDelete}-${streamType}`];
			}),
			false,
			'AM/DELETE_SUB'
		);
	},
	setBackgroundStream: (meetingId: string, stream: MediaStream): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.virtualBackground.updatedStream = stream;
			}),
			false,
			'AM/SET_BACKGROUND_STREAM'
		);
	},
	removeBackgroundStream: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				delete draft.activeMeeting.virtualBackground.updatedStream;
			}),
			false,
			'AM/REMOVE_BACKGROUND_STREAM'
		);
	},
	setBackgroundImage: (meetingId: string, image: VirtualBackgroundType): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				draft.activeMeeting.virtualBackground.backgroundImage = image;
			}),
			false,
			'AM/SET_BACKGROUND_IMAGE'
		);
	},
	setUserWithHandRaised: (meetingId: string, userId: string, isRaised: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				const { usersWithHandRaised } = draft.activeMeeting;
				if (!usersWithHandRaised) return;

				if (isRaised) {
					// If flag is true, add the ID to the array if it's not already present
					if (!draft.activeMeeting.usersWithHandRaised.includes(userId)) {
						draft.activeMeeting.usersWithHandRaised.push(userId);
					}
				} else {
					draft.activeMeeting.usersWithHandRaised = usersWithHandRaised.filter(
						(id) => id !== userId
					);
				}
			}),
			false,
			'AM/SET_USER_WITH_HAND_RAISED'
		);
	}
});
