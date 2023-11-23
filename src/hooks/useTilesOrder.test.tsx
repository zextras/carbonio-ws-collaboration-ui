/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook } from '@testing-library/react-hooks';

import useTilesOrder from './useTilesOrder';
import useStore from '../store/Store';
import { createMockMeeting, createMockParticipants, createMockRoom } from '../tests/createMock';
import { STREAM_TYPE } from '../types/store/ActiveMeetingTypes';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const participant0 = createMockParticipants({ userId: '0', joinedAt: '2023-09-18T09:00:59.000Z' });
const sessionUser = createMockParticipants({ userId: 'id', joinedAt: '2023-09-18T09:01:00.000Z' });
const participant1 = createMockParticipants({ userId: '1', joinedAt: '2023-09-18T09:01:01.000Z' });
const participant2 = createMockParticipants({ userId: '2', joinedAt: '2023-09-18T09:02:02.000Z' });
const participant3 = createMockParticipants({ userId: '3', joinedAt: '2023-09-18T09:03:03.000Z' });
const participant4 = createMockParticipants({ userId: '4', joinedAt: '2023-09-18T09:04:04.000Z' });
const participant5 = createMockParticipants({ userId: '5', joinedAt: '2023-09-18T09:05:05.000Z' });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('0', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
});

describe('useTilesOrder custom hook - ordered by joined time', () => {
	test('Only me in the meeting', () => {
		useStore.getState().addParticipant(meeting.id, sessionUser);
		const { result } = renderHook(() => useTilesOrder(meeting.id));

		expect(result.current.centralTile).toEqual({
			userId: sessionUser.userId,
			type: 'video',
			creationDate: sessionUser.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([]);
	});

	test('Two participant - I enter as first', () => {
		useStore.getState().addParticipant(meeting.id, sessionUser);
		useStore.getState().addParticipant(meeting.id, participant1);
		const { result } = renderHook(() => useTilesOrder(meeting.id));

		expect(result.current.centralTile).toEqual({
			userId: sessionUser.userId,
			type: 'video',
			creationDate: sessionUser.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant1.userId, type: 'video', creationDate: participant1.joinedAt }
		]);
	});

	test('Two participants - I enter as second', () => {
		useStore.getState().addParticipant(meeting.id, participant0);
		useStore.getState().addParticipant(meeting.id, sessionUser);
		const { result } = renderHook(() => useTilesOrder(meeting.id));

		expect(result.current.centralTile).toEqual({
			userId: participant0.userId,
			type: 'video',
			creationDate: participant0.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{
				userId: sessionUser.userId,
				type: 'video',
				creationDate: sessionUser.joinedAt
			}
		]);
	});

	test('A new participant enters', () => {
		useStore.getState().addParticipant(meeting.id, participant4);
		useStore.getState().addParticipant(meeting.id, participant2);
		useStore.getState().addParticipant(meeting.id, participant1);
		useStore.getState().addParticipant(meeting.id, participant3);
		const { result } = renderHook(() => useTilesOrder(meeting.id));

		expect(result.current.centralTile).toEqual({
			userId: participant1.userId,
			type: 'video',
			creationDate: participant1.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant2.userId, type: 'video', creationDate: participant2.joinedAt },
			{ userId: participant3.userId, type: 'video', creationDate: participant3.joinedAt },
			{ userId: participant4.userId, type: 'video', creationDate: participant4.joinedAt }
		]);

		act(() => useStore.getState().addParticipant(meeting.id, participant5));

		expect(result.current.centralTile).toEqual({
			userId: participant1.userId,
			type: 'video',
			creationDate: participant1.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant2.userId, type: 'video', creationDate: participant2.joinedAt },
			{ userId: participant3.userId, type: 'video', creationDate: participant3.joinedAt },
			{ userId: participant4.userId, type: 'video', creationDate: participant4.joinedAt },
			{ userId: participant5.userId, type: 'video', creationDate: participant5.joinedAt }
		]);
	});

	test('A participant leaves the meeting', () => {
		useStore.getState().addParticipant(meeting.id, participant4);
		useStore.getState().addParticipant(meeting.id, participant2);
		useStore.getState().addParticipant(meeting.id, participant1);
		useStore.getState().addParticipant(meeting.id, participant3);

		const { result } = renderHook(() => useTilesOrder(meeting.id));

		act(() => useStore.getState().removeParticipant(meeting.id, participant2.userId));

		expect(result.current.centralTile).toEqual({
			userId: participant1.userId,
			type: 'video',
			creationDate: participant1.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant3.userId, type: 'video', creationDate: participant3.joinedAt },
			{ userId: participant4.userId, type: 'video', creationDate: participant4.joinedAt }
		]);
	});
});

describe('useTilesOrder custom hook - use pin feature', () => {
	test('Pin a tile --> swipe tiles position with the central one', () => {
		useStore.getState().addParticipant(meeting.id, participant1);
		useStore.getState().addParticipant(meeting.id, participant2);
		useStore.getState().addParticipant(meeting.id, participant3);
		useStore.getState().addParticipant(meeting.id, participant4);

		const { result } = renderHook(() => useTilesOrder(meeting.id));

		act(() =>
			useStore.getState().setPinnedTile(meeting.id, { userId: '3', type: STREAM_TYPE.VIDEO })
		);

		expect(result.current.centralTile).toEqual({
			userId: participant3.userId,
			type: 'video',
			creationDate: participant3.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant2.userId, type: 'video', creationDate: participant2.joinedAt },
			{ userId: participant1.userId, type: 'video', creationDate: participant1.joinedAt },
			{ userId: participant4.userId, type: 'video', creationDate: participant4.joinedAt }
		]);
	});

	test("Unpin a tile --> positions of all tiles don't change", () => {
		useStore.getState().addParticipant(meeting.id, participant1);
		useStore.getState().addParticipant(meeting.id, participant2);
		useStore.getState().addParticipant(meeting.id, participant3);
		useStore.getState().addParticipant(meeting.id, participant4);

		const { result } = renderHook(() => useTilesOrder(meeting.id));

		act(() =>
			useStore.getState().setPinnedTile(meeting.id, { userId: '3', type: STREAM_TYPE.VIDEO })
		);
		act(() => useStore.getState().setPinnedTile(meeting.id, undefined));

		expect(result.current.centralTile).toEqual({
			userId: participant3.userId,
			type: 'video',
			creationDate: participant3.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant2.userId, type: 'video', creationDate: participant2.joinedAt },
			{ userId: participant1.userId, type: 'video', creationDate: participant1.joinedAt },
			{ userId: participant4.userId, type: 'video', creationDate: participant4.joinedAt }
		]);
	});

	test('Pin a tile that no longer exists', () => {
		useStore.getState().addParticipant(meeting.id, participant1);
		useStore.getState().addParticipant(meeting.id, participant2);
		useStore.getState().addParticipant(meeting.id, participant4);

		const { result } = renderHook(() => useTilesOrder(meeting.id));

		act(() =>
			useStore.getState().setPinnedTile(meeting.id, { userId: '3', type: STREAM_TYPE.VIDEO })
		);

		expect(result.current.centralTile).toEqual({
			userId: participant1.userId,
			type: 'video',
			creationDate: participant1.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant2.userId, type: 'video', creationDate: participant2.joinedAt },
			{ userId: participant4.userId, type: 'video', creationDate: participant4.joinedAt }
		]);
	});

	test('Pin a tile and re-pin the previous one --> return the initial order ', () => {
		useStore.getState().addParticipant(meeting.id, participant1);
		useStore.getState().addParticipant(meeting.id, participant2);
		useStore.getState().addParticipant(meeting.id, participant3);
		useStore.getState().addParticipant(meeting.id, participant4);

		const { result } = renderHook(() => useTilesOrder(meeting.id));

		act(() =>
			useStore.getState().setPinnedTile(meeting.id, { userId: '3', type: STREAM_TYPE.VIDEO })
		);

		act(() => {
			useStore.getState().setPinnedTile(meeting.id, { userId: '3', type: STREAM_TYPE.VIDEO });
			useStore.getState().setPinnedTile(meeting.id, { userId: '1', type: STREAM_TYPE.VIDEO });
		});

		expect(result.current.centralTile).toEqual({
			userId: participant1.userId,
			type: 'video',
			creationDate: participant1.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant2.userId, type: 'video', creationDate: participant2.joinedAt },
			{ userId: participant3.userId, type: 'video', creationDate: participant3.joinedAt },
			{ userId: participant4.userId, type: 'video', creationDate: participant4.joinedAt }
		]);
	});

	test('A new participant enters while there is a pinned tile', () => {
		useStore.getState().addParticipant(meeting.id, participant4);
		useStore.getState().addParticipant(meeting.id, participant2);
		useStore.getState().addParticipant(meeting.id, participant1);
		useStore.getState().addParticipant(meeting.id, participant3);
		const { result } = renderHook(() => useTilesOrder(meeting.id));

		act(() => {
			useStore.getState().setPinnedTile(meeting.id, { userId: '3', type: STREAM_TYPE.VIDEO });
			useStore.getState().addParticipant(meeting.id, participant5);
		});

		expect(result.current.centralTile).toEqual({
			userId: participant3.userId,
			type: 'video',
			creationDate: participant3.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant2.userId, type: 'video', creationDate: participant2.joinedAt },
			{ userId: participant1.userId, type: 'video', creationDate: participant1.joinedAt },
			{ userId: participant4.userId, type: 'video', creationDate: participant4.joinedAt },
			{ userId: participant5.userId, type: 'video', creationDate: participant5.joinedAt }
		]);
	});

	test('A participant leaves the meeting while the is a pinned tile', () => {
		useStore.getState().addParticipant(meeting.id, participant4);
		useStore.getState().addParticipant(meeting.id, participant2);
		useStore.getState().addParticipant(meeting.id, participant1);
		useStore.getState().addParticipant(meeting.id, participant3);

		const { result } = renderHook(() => useTilesOrder(meeting.id));

		act(() => {
			useStore.getState().setPinnedTile(meeting.id, { userId: '3', type: STREAM_TYPE.VIDEO });
			useStore.getState().removeParticipant(meeting.id, participant2.userId);
		});

		expect(result.current.centralTile).toEqual({
			userId: participant3.userId,
			type: 'video',
			creationDate: participant3.joinedAt
		});
		expect(result.current.carouselTiles).toEqual([
			{ userId: participant1.userId, type: 'video', creationDate: participant1.joinedAt },
			{ userId: participant4.userId, type: 'video', creationDate: participant4.joinedAt }
		]);
	});
});

describe('useTilesOrder custom hook - ordered by who is speaking', () => {
	test('flow of a user that speaks for more than 2 seconds, then stops, a tile get pinned and another user speaks for at least two seconds', () => {
		useStore.getState().addParticipant(meeting.id, participant4);
		useStore.getState().addParticipant(meeting.id, participant2);
		useStore.getState().addParticipant(meeting.id, participant1);
		useStore.getState().addParticipant(meeting.id, participant3);
		const { result } = renderHook(() => useTilesOrder(meeting.id));

		act(() => {
			useStore.getState().setPinnedTile(meeting.id, { userId: '2', type: STREAM_TYPE.VIDEO });
			useStore.getState().setTalkingUser(meeting.id, participant3.userId, true);
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.carouselTiles[0]).toEqual({
			userId: participant1.userId,
			type: 'video',
			creationDate: participant1.joinedAt
		});

		act(() => {
			jest.advanceTimersByTime(2000);
		});

		expect(result.current.carouselTiles[0]).toEqual({
			userId: participant3.userId,
			type: 'video',
			creationDate: participant3.joinedAt
		});
	});
});
