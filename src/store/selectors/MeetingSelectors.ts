/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, find, forEach, size, sortBy } from 'lodash';

import { STREAM_TYPE, Subscription, TileData } from '../../types/store/ActiveMeetingTypes';
import { Meeting, MeetingParticipantMap } from '../../types/store/MeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMeeting = (store: RootStore, roomId: string): Meeting | undefined =>
	store.meetings[roomId];

export const getMeetingByMeetingId = (store: RootStore, meetingId: string): Meeting | undefined =>
	find(store.meetings, (meeting) => meeting.id === meetingId);

export const getRoomIdByMeetingId = (store: RootStore, meetingId: string): string | undefined =>
	find(store.meetings, (meeting) => meeting.id === meetingId)?.roomId;

export const getMeetingActive = (store: RootStore, roomId: string): boolean =>
	store.meetings[roomId] && store.meetings[roomId].active;
export const getMeetingParticipants = (
	store: RootStore,
	roomId: string
): MeetingParticipantMap | undefined => store.meetings[roomId]?.participants;

export const getMeetingParticipantsByMeetingId = (
	store: RootStore,
	meetingId: string
): MeetingParticipantMap | undefined =>
	find(store.meetings, (meeting) => meeting.id === meetingId)?.participants;

export const getMyMeetingParticipation = (store: RootStore, roomId: string): boolean => {
	if (store.meetings[roomId]?.participants && store.session.id != null) {
		const sessionMember = find(
			store.meetings[roomId].participants,
			(member) => member.userId === store.session.id
		);
		return sessionMember != null;
	}
	return false;
};

export const getNumberOfMeetingParticipants = (
	store: RootStore,
	roomId: string
): number | undefined => size(store.meetings[roomId]?.participants);

export const getNumberOfMeetingParticipantsByMeetingId = (
	store: RootStore,
	meetingId: string
): number | undefined =>
	size(find(store.meetings, (meeting) => meeting.id === meetingId)?.participants);
export const getParticipantAudioStatus = (
	store: RootStore,
	meetingId: string | undefined,
	userId: string | undefined
): boolean => {
	if (!meetingId || !userId) return false;
	const meeting = find(store.meetings, (meeting) => meeting.id === meetingId);
	const participant = find(meeting?.participants, (participant) => participant.userId === userId);
	return participant?.audioStreamOn ?? false;
};

export const getParticipantVideoStatus = (
	store: RootStore,
	meetingId: string | undefined,
	userId: string | undefined
): boolean => {
	const meeting = find(store.meetings, (meeting) => meeting.id === meetingId);
	const participant = find(meeting?.participants, (participant) => participant.userId === userId);
	return participant?.videoStreamOn ?? false;
};

export const getParticipantScreenStatus = (
	store: RootStore,
	meetingId: string | undefined,
	userId: string | undefined
): boolean => {
	const meeting = find(store.meetings, (meeting) => meeting.id === meetingId);
	const participant = find(meeting?.participants, (participant) => participant.userId === userId);
	return participant?.screenStreamOn ?? false;
};

export const getTiles = (store: RootStore, meetingId: string): TileData[] => {
	const meeting = find(store.meetings, (meeting) => meeting.id === meetingId);
	if (meeting) {
		const tiles: TileData[] = [];
		const sortedParticipants = sortBy(meeting.participants, (participant) => participant.joinedAt);
		forEach(sortedParticipants, (participant) => {
			tiles.push({
				userId: participant.userId,
				type: STREAM_TYPE.VIDEO,
				creationDate: participant.joinedAt
			});
			if (participant.screenStreamOn) {
				tiles.push({
					userId: participant.userId,
					type: STREAM_TYPE.SCREEN,
					creationDate: participant.dateScreenOn
				});
			}
		});
		return tiles;
	}
	return [];
};

export const getCentralTileData = (store: RootStore, meetingId: string): TileData | undefined => {
	const meeting = find(store.meetings, (meeting) => meeting.id === meetingId);
	const participant = find(
		meeting?.participants,
		(participant) => participant.userId !== store.session.id
	);
	if (participant) {
		return {
			userId: participant.userId,
			type: STREAM_TYPE.VIDEO
		};
	}
	const myScreenIsEnabled = find(
		meeting?.participants,
		(participant) => participant.userId === store.session.id && participant.screenStreamOn === true
	);
	if (myScreenIsEnabled) {
		return {
			userId: store.session.id!,
			type: STREAM_TYPE.SCREEN
		};
	}
	return undefined;
};

export const getSubscriptions = (store: RootStore, meetingId: string): Subscription[] => {
	const meeting = find(store.meetings, (meeting) => meeting.id === meetingId);
	if (meeting) {
		const subscriptions: Subscription[] = [];
		forEach(meeting.participants, (participant) => {
			if (participant.userId !== store.session.id) {
				if (participant.videoStreamOn) {
					subscriptions.push({
						userId: participant.userId,
						type: STREAM_TYPE.VIDEO
					});
				}
				if (participant.screenStreamOn) {
					subscriptions.push({
						userId: participant.userId,
						type: STREAM_TYPE.SCREEN
					});
				}
			}
		});
		return subscriptions;
	}
	return [];
};

export const getTotalNumberOfTiles = (store: RootStore, meetingId: string): number => {
	const meeting = find(store.meetings, (meeting) => meeting.id === meetingId);
	if (meeting) {
		const participantWithScreen = filter(
			meeting.participants,
			(participant) => participant.screenStreamOn === true
		);
		return size(meeting.participants) + size(participantWithScreen);
	}
	return 0;
};
