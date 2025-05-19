/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, find, reduce, size, some } from 'lodash';

import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE, TileData } from '../../types/store/ActiveMeetingTypes';
import { Meeting, MeetingParticipantMap } from '../../types/store/MeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMeeting = (store: RootStore, meetingId: string): Meeting | undefined =>
	store.meetings[meetingId];

export const getMeetingByRoomId = (store: RootStore, roomId: string): Meeting | undefined =>
	find(store.meetings, (meeting) => meeting.roomId === roomId);

export const getRoomIdByMeetingId = (store: RootStore, meetingId: string): string | undefined =>
	store.meetings[meetingId]?.roomId;

export const getMeetingActive = (store: RootStore, roomId: string): boolean =>
	!!find(store.meetings, (meeting) => meeting.roomId === roomId)?.active;

export const getMeetingActiveByMeetingId = (store: RootStore, meetingId: string): boolean =>
	!!store.meetings[meetingId]?.active;

export const getIfThereAreActiveVirtualRooms = (store: RootStore): boolean =>
	some(
		store.meetings,
		(meeting) => meeting.meetingType === MeetingType.SCHEDULED && meeting.active
	);

export const getMeetingParticipants = (
	store: RootStore,
	meetingId: string
): MeetingParticipantMap | undefined => store.meetings[meetingId]?.participants;

export const getMeetingParticipantsByRoomId = (
	store: RootStore,
	roomId: string
): MeetingParticipantMap | undefined => {
	const meeting = find(store.meetings, (meeting) => meeting.roomId === roomId);
	return meeting?.participants;
};

export const getMyMeetingParticipation = (store: RootStore, roomId: string): boolean => {
	const participants = getMeetingParticipantsByRoomId(store, roomId);
	if (participants && store.session.id != null) {
		const sessionMember = find(participants, (member) => member.userId === store.session.id);
		return sessionMember != null;
	}
	return false;
};

export const getNumberOfMeetingParticipants = (store: RootStore, roomId: string): number =>
	size(getMeetingParticipantsByRoomId(store, roomId));

export const getNumberOfMeetingParticipantsByMeetingId = (
	store: RootStore,
	meetingId: string
): number => size(store.meetings[meetingId]?.participants);

export const getParticipantAudioStatus = (
	store: RootStore,
	meetingId: string | undefined,
	userId: string | undefined
): boolean => {
	if (!meetingId || !userId) return false;
	const meeting = store.meetings[meetingId];
	const participant = find(meeting?.participants, (participant) => participant.userId === userId);
	return participant?.audioStreamOn ?? false;
};

export const getParticipantVideoStatus = (
	store: RootStore,
	meetingId: string | undefined,
	userId: string | undefined
): boolean => {
	if (!meetingId || !userId) return false;
	const meeting = store.meetings[meetingId];
	const participant = find(meeting?.participants, (participant) => participant.userId === userId);
	return participant?.videoStreamOn ?? false;
};

export const getParticipantScreenStatus = (
	store: RootStore,
	meetingId: string | undefined,
	userId: string | undefined
): boolean => {
	if (!meetingId || !userId) return false;
	const meeting = store.meetings[meetingId];
	const participant = find(meeting?.participants, (participant) => participant.userId === userId);
	return participant?.screenStreamOn ?? false;
};

const centralTileData: TileData = <TileData>{};

export const getCentralTileData = (store: RootStore, meetingId: string): TileData | undefined => {
	Object.assign(centralTileData, {});
	const meeting = store.meetings[meetingId];
	const participant = find(
		meeting?.participants,
		(participant) => participant.userId !== store.session.id
	);
	if (participant) {
		Object.assign(centralTileData, {
			userId: participant.userId,
			type: STREAM_TYPE.VIDEO
		});
		return centralTileData;
	}
	const myScreenIsEnabled = find(
		meeting?.participants,
		(participant) => participant.userId === store.session.id && participant.screenStreamOn === true
	);
	if (myScreenIsEnabled) {
		Object.assign(centralTileData, {
			userId: store.session.id!,
			type: STREAM_TYPE.SCREEN
		});
		return centralTileData;
	}
	return undefined;
};

export const getNumberOfTiles = (store: RootStore, meetingId: string): number => {
	const meeting = store.meetings[meetingId];
	if (meeting) {
		const participantWithScreen = filter(
			meeting.participants,
			(participant) => participant.screenStreamOn === true
		);
		return size(meeting.participants) + size(participantWithScreen);
	}
	return 0;
};

const emptyList: string[] = [];

export const getWaitingList = (store: RootStore, meetingId: string): string[] => {
	const meeting = store.meetings[meetingId];
	if (meeting) {
		return meeting.waitingList || emptyList;
	}
	return emptyList;
};

export const getWaitingListSizeForMyVirtualMeeting = (store: RootStore): number => {
	const myMeetings = filter(store.meetings, (meeting) => {
		const userIsParticipant = find(
			meeting.participants,
			(participant) => participant.userId === store.session.id
		);
		const userIsOwner = find(
			store.rooms[meeting.roomId]?.members,
			(member) => member.userId === store.session.id && member.owner
		);
		return !!userIsParticipant && !!userIsOwner;
	});
	return reduce(myMeetings, (acc, meeting) => acc + size(meeting.waitingList || []), 0);
};

export const getMeetingStartedAt = (
	store: RootStore,
	meetingId: string | undefined
): string | undefined => {
	if (!meetingId) return undefined;
	return store.meetings[meetingId]?.startedAt;
};

export const getMeetingRecordingTimestamp = (
	store: RootStore,
	meetingId: string
): string | undefined => store.meetings[meetingId]?.recStartedAt;

export const getIsMeetingRecording = (store: RootStore, meetingId: string): boolean =>
	!!store.meetings[meetingId]?.recStartedAt;

export const getStartRecordingUserId = (store: RootStore, meetingId: string): string | undefined =>
	store.meetings[meetingId]?.recUserId;
