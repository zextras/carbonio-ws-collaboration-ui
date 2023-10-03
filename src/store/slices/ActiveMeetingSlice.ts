/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import BidirectionalConnectionAudioInOut from '../../network/webRTC/BidirectionalConnectionAudioInOut';
import VideoInConnection from '../../network/webRTC/VideoInConnection';
import VideoOutConnection from '../../network/webRTC/VideoOutConnection';
import {
	MeetingChatVisibility,
	MeetingViewType,
	STREAM_TYPE,
	StreamsSubscriptionMap,
	TileData
} from '../../types/store/ActiveMeetingTypes';
import { ActiveMeetingSlice, RootStore } from '../../types/store/StoreTypes';

export const useActiveMeetingSlice = (set: (...any: any) => void): ActiveMeetingSlice => ({
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
						participantsAccordionIsOpened: false
					},
					chatVisibility: MeetingChatVisibility.CLOSED,
					meetingViewSelected: MeetingViewType.CINEMA,
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
					videoInConn: new VideoInConnection(meetingId),
					videoOutConn: videoStreamEnabled
						? new VideoOutConnection(meetingId, videoStreamEnabled, selectedVideoDeviceId)
						: undefined,
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
				draft.activeMeeting[meetingId]?.videoInConn?.closePeerConnection();
				draft.activeMeeting[meetingId]?.videoOutConn?.closePeerConnection();
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
						draft.setPinnedTile(meetingId, undefined);
					}
				}
			}),
			false,
			'AM/SET_VIEW_TYPE'
		);
	},
	createShareOutConn: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				// TODO IMPLEMENT
				const shareOutConn = new VideoInConnection(meetingId);
				if (!draft.activeMeeting[meetingId].shareOutConn) {
					draft.activeMeeting[meetingId].shareOutConn = shareOutConn;
				}
			}),
			false,
			'AM/SET_SHARE_OUT_CONN'
		);
	},
	closeShareOutConn: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.shareOutConn?.closePeerConnection();
			}),
			false,
			'AM/CLOSE_SHARE_OUT_CONN'
		);
	},

	setLocalStreams: (meetingId: string, streamType: STREAM_TYPE, stream: MediaStream): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting[meetingId]?.localStreams?.[streamType]) {
					draft.activeMeeting[meetingId].localStreams = {
						...draft.activeMeeting[meetingId].localStreams,
						[streamType]: stream
					};
				} else {
					draft.activeMeeting[meetingId].localStreams = {
						...draft.activeMeeting[meetingId].localStreams,
						[streamType]: stream
					};
				}
			}),
			false,
			'AM/SET_LOCAL_STREAM'
		);
	},
	removeLocalStreams: (meetingId: string, streamType: STREAM_TYPE): void => {
		set(
			produce((draft: RootStore) => {
				if (streamType === STREAM_TYPE.VIDEO) {
					draft.activeMeeting[meetingId].localStreams?.[streamType]?.getVideoTracks()[0].stop();
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
	setTalkingUsers: (meetingId: string, userId: string, isTalking: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (isTalking) {
					// If flag is true, add the ID to the array if it's not already present
					if (!draft.activeMeeting[meetingId].talkingUsers.includes(userId)) {
						draft.activeMeeting[meetingId].talkingUsers.push(userId);
					}
				} else {
					// If flag is false, remove the ID from the array if it's present
					const index = draft.activeMeeting[meetingId].talkingUsers.indexOf(userId);
					if (index !== -1) {
						draft.activeMeeting[meetingId].talkingUsers?.splice(index, 1);
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
					draft.activeMeeting[meetingId].pinnedTile = tile;
				}
			}),
			false,
			'AM/SET_PINNED_TILE'
		);
	}
});
