/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	findAllPossiblePairs,
	maximiseRowsAndColumns,
	maximiseTileSize,
	MeetingSoundFeedback,
	orderSpeakingTiles,
	sendAudioFeedback
} from './MeetingsUtils';
import { mockPlayAudio } from '../tests/mocks/global';
import { STREAM_TYPE, TileData } from '../types/store/ActiveMeetingTypes';

describe('MeetingsUtils', () => {
	describe('Audio feedback', () => {
		test('test return of meetingIn notification', () => {
			mockPlayAudio.mockImplementation(() => Promise.resolve());

			sendAudioFeedback(MeetingSoundFeedback.MEETING_JOIN_NOTIFICATION);
			sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_ON);
			sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_OFF);
			sendAudioFeedback(MeetingSoundFeedback.MEETING_SCREENSHARE_NOTIFICATION);
			sendAudioFeedback(MeetingSoundFeedback.MEETING_LEAVE_NOTIFICATION);
			sendAudioFeedback(MeetingSoundFeedback.NEW_WAITING_USER);

			expect(mockPlayAudio).toHaveBeenCalledTimes(6);
		});
	});

	describe('maximiseRowsAndColumns', () => {
		test('950x500 - 600', () => {
			const { rows, columns } = maximiseRowsAndColumns({ width: 950, height: 500 }, 600);
			expect(rows).toBe(1);
			expect(columns).toBe(1);
		});

		test('950x500 - 400', () => {
			const { rows, columns } = maximiseRowsAndColumns({ width: 950, height: 500 }, 400);
			expect(rows).toBe(2);
			expect(columns).toBe(2);
		});

		test('950x500 - 200', () => {
			const { rows, columns } = maximiseRowsAndColumns({ width: 950, height: 500 }, 200);
			expect(rows).toBe(3);
			expect(columns).toBe(4);
		});

		test('500x500 - 400', () => {
			const { rows, columns } = maximiseRowsAndColumns({ width: 500, height: 500 }, 400);
			expect(rows).toBe(2);
			expect(columns).toBe(1);
		});

		test('500x500 - 200', () => {
			const { rows, columns } = maximiseRowsAndColumns({ width: 500, height: 500 }, 200);
			expect(rows).toBe(3);
			expect(columns).toBe(2);
		});
	});

	describe('findAllPossiblePairs', () => {
		test('1 tile', () => {
			const pairs = findAllPossiblePairs(1);
			expect(pairs).toEqual([{ rows: 1, columns: 1 }]);
		});
		test('2 tiles', () => {
			const pairs = findAllPossiblePairs(2);
			expect(pairs).toEqual([
				{ rows: 1, columns: 2 },
				{ rows: 2, columns: 1 }
			]);
		});
		test('3 tiles', () => {
			const pairs = findAllPossiblePairs(3);
			expect(pairs).toEqual([
				{ rows: 1, columns: 3 },
				{ rows: 2, columns: 2 },
				{ rows: 3, columns: 1 }
			]);
		});
		test('4 tiles', () => {
			const pairs = findAllPossiblePairs(4);
			expect(pairs).toEqual([
				{ rows: 1, columns: 4 },
				{ rows: 2, columns: 2 },
				{ rows: 4, columns: 1 }
			]);
		});
		test('5 tiles', () => {
			const pairs = findAllPossiblePairs(5);
			expect(pairs).toEqual([
				{ rows: 1, columns: 5 },
				{ rows: 2, columns: 3 },
				{ rows: 3, columns: 2 },
				{ rows: 5, columns: 1 }
			]);
		});
		test('6 tiles', () => {
			const pairs = findAllPossiblePairs(6);
			expect(pairs).toEqual([
				{ rows: 1, columns: 6 },
				{ rows: 2, columns: 3 },
				{ rows: 3, columns: 2 },
				{ rows: 6, columns: 1 }
			]);
		});
		test('7 tiles', () => {
			const pairs = findAllPossiblePairs(7);
			expect(pairs).toEqual([
				{ rows: 1, columns: 7 },
				{ rows: 2, columns: 4 },
				{ rows: 3, columns: 3 },
				{ rows: 4, columns: 2 },
				{ rows: 7, columns: 1 }
			]);
		});
		test('8 tiles', () => {
			const pairs = findAllPossiblePairs(8);
			expect(pairs).toEqual([
				{ rows: 1, columns: 8 },
				{ rows: 2, columns: 4 },
				{ rows: 3, columns: 3 },
				{ rows: 4, columns: 2 },
				{ rows: 8, columns: 1 }
			]);
		});
		test('9 tiles', () => {
			const pairs = findAllPossiblePairs(9);
			expect(pairs).toEqual([
				{ rows: 1, columns: 9 },
				{ rows: 2, columns: 5 },
				{ rows: 3, columns: 3 },
				{ rows: 5, columns: 2 },
				{ rows: 9, columns: 1 }
			]);
		});
		test('10 tiles', () => {
			const pairs = findAllPossiblePairs(10);
			expect(pairs).toEqual([
				{ rows: 1, columns: 10 },
				{ rows: 2, columns: 5 },
				{ rows: 3, columns: 4 },
				{ rows: 4, columns: 3 },
				{ rows: 5, columns: 2 },
				{ rows: 10, columns: 1 }
			]);
		});
		test('13 tiles', () => {
			const pairs = findAllPossiblePairs(13);
			expect(pairs).toEqual([
				{ rows: 1, columns: 13 },
				{ rows: 2, columns: 7 },
				{ rows: 3, columns: 5 },
				{ rows: 4, columns: 4 },
				{ rows: 5, columns: 3 },
				{ rows: 7, columns: 2 },
				{ rows: 13, columns: 1 }
			]);
		});
		test('19 tiles', () => {
			const pairs = findAllPossiblePairs(19);
			expect(pairs).toEqual([
				{ rows: 1, columns: 19 },
				{ rows: 2, columns: 10 },
				{ rows: 3, columns: 7 },
				{ rows: 4, columns: 5 },
				{ rows: 5, columns: 4 },
				{ rows: 7, columns: 3 },
				{ rows: 10, columns: 2 },
				{ rows: 19, columns: 1 }
			]);
		});
	});

	describe('maximiseTileSize', () => {
		test('1200x900 - 3 tiles', () => {
			const { rows, columns } = maximiseTileSize({ width: 1200, height: 900 }, 3);
			expect(rows).toBe(2);
			expect(columns).toBe(2);
		});
		test('1200x900 - 4 tiles', () => {
			const { rows, columns } = maximiseTileSize({ width: 1200, height: 900 }, 4);
			expect(rows).toBe(2);
			expect(columns).toBe(2);
		});
		test('1200x900 - 5 tiles', () => {
			const { rows, columns } = maximiseTileSize({ width: 1200, height: 900 }, 5);
			expect(rows).toBe(3);
			expect(columns).toBe(2);
		});
		test('1200x900 - 6 tiles', () => {
			const { rows, columns } = maximiseTileSize({ width: 1200, height: 900 }, 6);
			expect(rows).toBe(3);
			expect(columns).toBe(2);
		});
		test('1200x900 - 8 tiles', () => {
			const { rows, columns } = maximiseTileSize({ width: 1200, height: 900 }, 8);
			expect(rows).toBe(3);
			expect(columns).toBe(3);
		});
	});

	describe('orderSpeakingTiles', () => {
		test('in a 3 people meeting, when there is no pinned tile and the last one is speaking, it goes on top of the list', () => {
			const meetingTiles: TileData[] = [
				{ userId: 'user1', type: STREAM_TYPE.VIDEO },
				{ userId: 'user2', type: STREAM_TYPE.VIDEO },
				{ userId: 'user3', type: STREAM_TYPE.VIDEO }
			];
			const orderedTiles = orderSpeakingTiles(meetingTiles, 'user3', false);
			expect(orderedTiles[0]?.userId).toBe('user3');
			expect(orderedTiles[1]?.userId).toBe('user1');
			expect(orderedTiles[2]?.userId).toBe('user2');
		});
		test('in a 3 people meeting, when there is no pinned tile and the second one is speaking, it goes on top of the list', () => {
			const meetingTiles: TileData[] = [
				{ userId: 'user1', type: STREAM_TYPE.VIDEO },
				{ userId: 'user2', type: STREAM_TYPE.VIDEO },
				{ userId: 'user3', type: STREAM_TYPE.VIDEO }
			];
			const orderedTiles = orderSpeakingTiles(meetingTiles, 'user2', false);
			expect(orderedTiles[0]?.userId).toBe('user2');
			expect(orderedTiles[1]?.userId).toBe('user1');
			expect(orderedTiles[2]?.userId).toBe('user3');
		});
		test('in a 7 people meeting, when there is no pinned tile and the sixth one is speaking, it goes on top of the list', () => {
			const meetingTiles: TileData[] = [
				{ userId: 'user1', type: STREAM_TYPE.VIDEO },
				{ userId: 'user2', type: STREAM_TYPE.AUDIO },
				{ userId: 'user3', type: STREAM_TYPE.VIDEO },
				{ userId: 'user4', type: STREAM_TYPE.AUDIO },
				{ userId: 'user5', type: STREAM_TYPE.VIDEO },
				{ userId: 'user6', type: STREAM_TYPE.AUDIO },
				{ userId: 'user7', type: STREAM_TYPE.VIDEO }
			];
			const orderedTiles = orderSpeakingTiles(meetingTiles, 'user6', false);
			expect(orderedTiles[0]?.userId).toBe('user6');
			expect(orderedTiles[1]?.userId).toBe('user1');
			expect(orderedTiles[2]?.userId).toBe('user2');
			expect(orderedTiles[3]?.userId).toBe('user3');
			expect(orderedTiles[4]?.userId).toBe('user4');
			expect(orderedTiles[5]?.userId).toBe('user5');
			expect(orderedTiles[6]?.userId).toBe('user7');
		});
		test('in a 3 people meeting, when there is a pinned tile and the last one is speaking, it goes on the second place of the list', () => {
			const meetingTiles: TileData[] = [
				{ userId: 'user1', type: STREAM_TYPE.VIDEO },
				{ userId: 'user2', type: STREAM_TYPE.VIDEO },
				{ userId: 'user3', type: STREAM_TYPE.VIDEO }
			];
			const orderedTiles = orderSpeakingTiles(meetingTiles, 'user3', true);
			expect(orderedTiles[0]?.userId).toBe('user1');
			expect(orderedTiles[1]?.userId).toBe('user3');
			expect(orderedTiles[2]?.userId).toBe('user2');
		});
		test('in a 3 people meeting, when there is a screenshare and the second one is speaking, it goes on the second place of the list', () => {
			const meetingTiles: TileData[] = [
				{ userId: 'user3', type: STREAM_TYPE.SCREEN },
				{ userId: 'user1', type: STREAM_TYPE.VIDEO },
				{ userId: 'user2', type: STREAM_TYPE.VIDEO },
				{ userId: 'user3', type: STREAM_TYPE.VIDEO }
			];
			const orderedTiles = orderSpeakingTiles(meetingTiles, 'user2', true);
			expect(orderedTiles[0]).toEqual({ userId: 'user3', type: STREAM_TYPE.SCREEN });
			expect(orderedTiles[1]?.userId).toBe('user2');
			expect(orderedTiles[2]?.userId).toBe('user1');
			expect(orderedTiles[3]?.userId).toBe('user3');
		});
		test('more than one swapping does not break the tile list', () => {
			const meetingTiles: TileData[] = [
				{ userId: 'user1', type: STREAM_TYPE.SCREEN },
				{ userId: 'user1', type: STREAM_TYPE.VIDEO },
				{ userId: 'user2', type: STREAM_TYPE.AUDIO },
				{ userId: 'user3', type: STREAM_TYPE.VIDEO },
				{ userId: 'user4', type: STREAM_TYPE.AUDIO },
				{ userId: 'user5', type: STREAM_TYPE.VIDEO },
				{ userId: 'user6', type: STREAM_TYPE.AUDIO },
				{ userId: 'user7', type: STREAM_TYPE.VIDEO }
			];
			const orderedTiles = orderSpeakingTiles(meetingTiles, 'user5', true);
			expect(orderedTiles).toHaveLength(8);
			expect(orderedTiles[1]).toEqual({ userId: 'user5', type: STREAM_TYPE.VIDEO });

			const newOrderTiles = orderSpeakingTiles(orderedTiles, 'user2', true);
			expect(newOrderTiles).toHaveLength(8);
			expect(newOrderTiles[1]).toEqual({ userId: 'user2', type: STREAM_TYPE.AUDIO });
			expect(newOrderTiles[2]).toEqual({ userId: 'user5', type: STREAM_TYPE.VIDEO });
		});
	});
});
