/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { remove } from 'lodash';
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
	NetworkStats,
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
			deviceId?: string;
		},
		videoStream?: {
			enabled: boolean;
			deviceId?: string;
		}
	): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting = {
					meetingId,
					// Peer connections and streams
					bidirectionalAudioConn: new BidirectionalConnectionAudioInOut(
						meetingId,
						!!audioStream?.enabled,
						audioStream?.deviceId
					),
					videoScreenIn: new VideoScreenInConnection(meetingId),
					videoOutConn: new VideoOutConnection(
						meetingId,
						!!videoStream?.enabled,
						videoStream?.deviceId
					),
					screenOutConn: new ScreenOutConnection(meetingId),
					localStreams: {
						selectedAudioDeviceId: audioStream?.deviceId,
						selectedVideoDeviceId: videoStream?.deviceId
					},
					subscription: {},
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
					virtualBackground: {
						backgroundImage: VirtualBackgroundType.NONE
					},
					talkingUsers: [],
					usersWithHandRaised: [],
					videoSubscriptionsEnabled: true,
					manualVideoSubEnabled: false
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
	setLocalStreams: (streamType: STREAM_TYPE, stream: MediaStream): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.localStreams[streamType] = stream;
			}),
			false,
			'AM/SET_LOCAL_STREAM'
		);
	},
	removeLocalStreams: (streamType: STREAM_TYPE): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;

				if (streamType === STREAM_TYPE.VIDEO || streamType === STREAM_TYPE.SCREEN) {
					const stream = draft.activeMeeting.localStreams[streamType];
					stream?.getTracks().forEach((track) => track.stop());
				}
				delete draft.activeMeeting.localStreams[streamType];
			}),
			false,
			'AM/SET_LOCAL_STREAM'
		);
	},
	setSelectedDeviceId: (streamType: STREAM_TYPE, deviceId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;

				const key =
					streamType === STREAM_TYPE.AUDIO ? 'selectedAudioDeviceId' : 'selectedVideoDeviceId';
				draft.activeMeeting.localStreams[key] = deviceId;
			}),
			false,
			'AM/SET_SELECTED_DEVICE_ID'
		);
	},
	setSubscribedTracks: (meetingId: string, streams: StreamsSubscriptionMap): void => {
		set(
			produce((draft: RootStore) => {
				if (!isCurrentMeeting(draft, meetingId) || !draft.activeMeeting) return;
				// Check if the incoming streams are different from the current ones to avoid unnecessary updates
				const currentStreams = draft.activeMeeting.subscription;
				const incomingStreamKeys = Object.keys(streams);
				const currentStreamKeys = Object.keys(currentStreams);
				console.log(
					'Updating subscribed streams. Incoming streams:',
					streams,
					'Current streams:',
					currentStreams
				);
				const areStreamsEqual =
					incomingStreamKeys.length === currentStreamKeys.length &&
					incomingStreamKeys.every((key) => {
						const incomingStream = streams[key];
						const currentStream = currentStreams[key];
						return (
							currentStream &&
							incomingStream.userId === currentStream.userId &&
							incomingStream.type === currentStream.type &&
							incomingStream.stream?.id === currentStream.stream?.id
						);
					});

				if (areStreamsEqual) {
					console.log('Incoming subscribed streams are the same as current, skipping update');
					return;
				}
				draft.activeMeeting.subscription = streams;
			}),
			false,
			'AM/SET_SUBSCRIPTION'
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
	setIsCarouseVisible: (status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.isCarouselVisible = status;
			}),
			false,
			'AM/SET_MEETING_CAROUSEL_VISIBILITY'
		);
	},
	setPinnedTile: (tile: TileData | undefined): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
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
	setTalkingUser: (userId: string, isTalking: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;

				const { talkingUsers } = draft.activeMeeting;
				if (isTalking) {
					if (!talkingUsers.includes(userId)) {
						talkingUsers.push(userId);
					}
				} else {
					remove(talkingUsers, (id) => id === userId);
				}
			}),
			false,
			'AM/SET_IS_TALKING'
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
				if (!draft.activeMeeting.videoSubscriptionsEnabled) return;
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
				if (!draft.activeMeeting.videoSubscriptionsEnabled) return;
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
	setBackgroundStream: (stream: MediaStream): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.virtualBackground.updatedStream = stream;
			}),
			false,
			'AM/SET_BACKGROUND_STREAM'
		);
	},
	removeBackgroundStream: (): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				delete draft.activeMeeting.virtualBackground.updatedStream;
			}),
			false,
			'AM/REMOVE_BACKGROUND_STREAM'
		);
	},
	setBackgroundImage: (image: VirtualBackgroundType): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.virtualBackground.backgroundImage = image;
			}),
			false,
			'AM/SET_BACKGROUND_IMAGE'
		);
	},
	setUserWithHandRaised: (userId: string, isRaised: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
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
	},
	setNetworkStats: (stats: NetworkStats): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.networkStats = stats;
			}),
			false,
			'AM/SET_NETWORK_STATS'
		);
	},
	setVideoSubscriptionsEnabled: (enabled: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.videoSubscriptionsEnabled = enabled;

				if (enabled) {
					const { meetingId } = draft.activeMeeting;
					const myUserId = draft.session.id;
					const participants = draft.meetings[meetingId]?.participants;
					if (participants) {
						const subsToRequest = Object.values(participants).flatMap((p) => {
							const subs: Subscription[] = [];
							if (p.userId !== myUserId) {
								if (p.videoStreamOn) subs.push({ userId: p.userId, type: STREAM_TYPE.VIDEO });
								if (p.screenStreamOn) subs.push({ userId: p.userId, type: STREAM_TYPE.SCREEN });
							}
							return subs;
						});
						// for each participant change tile TileAvatarComponent to TileVideoComponent when enabling video subscriptions to show their video instead of a profile picture
						subsToRequest.forEach((sub) => {
							const participant = draft.meetings[meetingId].participants[sub.userId];
							if (participant && sub.type === STREAM_TYPE.VIDEO) {
								participant.hideVideoStream = false;
							}
						});

						if (subsToRequest.length > 0) {
							draft.activeMeeting.videoScreenIn?.subscriptionManager?.updateSubscription(
								subsToRequest
							);
						}
					}
				} else {
					const { meetingId } = draft.activeMeeting;
					const myUserId = draft.session.id;
					const participants = draft.meetings[meetingId]?.participants;
					if (participants) {
						const subsToMaintain: Subscription[] = [];
						const subsToDelete = Object.values(participants).flatMap((p) => {
							const subs: Subscription[] = [];
							if (p.userId !== myUserId) {
								if (p.videoStreamOn) subs.push({ userId: p.userId, type: STREAM_TYPE.VIDEO });
								if (p.screenStreamOn) subsToMaintain.push({ userId: p.userId, type: STREAM_TYPE.SCREEN });
							}
							return subs;
						});
						subsToDelete.forEach((sub) => {
							draft.activeMeeting?.videoScreenIn?.subscriptionManager?.removeSubscription(sub);
							draft.activeMeeting?.videoScreenIn?.removeStream(sub.userId, [sub.type]);
							delete draft.activeMeeting?.subscription[`${sub.userId}-${sub.type}`];
						});

						if (subsToDelete.length > 0) {
							draft.activeMeeting.videoScreenIn?.subscriptionManager?.updateSubscription(subsToMaintain);
						}

						subsToDelete.forEach((sub) => {
							const participant = draft.meetings[meetingId].participants[sub.userId];
							if (participant && sub.type === STREAM_TYPE.VIDEO) {
								participant.hideVideoStream = true;
							}
						});
					}
				}
			}),
			false,
			'AM/SET_VIDEO_SUBSCRIPTIONS_ENABLED'
		);
	},
	setManualVideoSubEnabled: (enabled: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting) return;
				draft.activeMeeting.manualVideoSubEnabled = enabled;
			}),
			false,
			'AM/SET_MANUAL_VIDEO_SUB_ENABLED'
		);
	}
});
