/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	calcTilesQuantity,
	listOfTileToShow,
	positionToStartOnNextButton,
	positionToStartOnPrevButton
} from './MeetingsUtils';

const us1 = 'us1'; // userId-screen
const us2 = 'us2'; // userId-video
const us3 = 'us3';
const us4 = 'us4';
const us5 = 'us5';
const us6 = 'us6';
const us7 = 'us7';
const us8 = 'us8';
const streamsInMeeting = [us1, us2, us3, us4, us5, us6, us7, us8];

describe('MeetingsUtils', () => {
	test('Test calcTilesQuantity', () => {
		expect(calcTilesQuantity(1140)).toBe(7);
	});
	describe('listOfTileToShow', () => {
		test('Display tiles from us1 to us4', () => {
			const result = listOfTileToShow(4, streamsInMeeting, 0);
			expect(result).toEqual([us1, us2, us3, us4]);
		});
		test('Display tiles from us1 to us4 when lastPosition is not set', () => {
			const result = listOfTileToShow(4, streamsInMeeting, null);
			expect(result).toEqual([us1, us2, us3, us4]);
		});
		test('Display tiles from us3 to us6', () => {
			const result = listOfTileToShow(4, streamsInMeeting, 1);
			expect(result).toEqual([us3, us4, us5, us6]);
		});
		test('Display tiles from us7 to us2', () => {
			const result = listOfTileToShow(4, streamsInMeeting, 6);
			expect(result).toEqual([us8, us1, us2, us3]);
		});
		test('Display tiles from us1 to us4 where position is at us8', () => {
			const result = listOfTileToShow(4, streamsInMeeting, 7);
			expect(result).toEqual([us1, us2, us3, us4]);
		});
	});
	describe('positionToStartOnPrevButton', () => {
		test('Return position for 4 tiles and last at index 5', () => {
			const result = positionToStartOnPrevButton(4, streamsInMeeting, 5);
			expect(result).toEqual(5);
		});
		test('Return position for 2 tiles and last at index 5', () => {
			const result = positionToStartOnPrevButton(2, streamsInMeeting, 5);
			expect(result).toEqual(1);
		});
		test('Return position for 7 tiles and last at index 7', () => {
			const result = positionToStartOnPrevButton(7, streamsInMeeting, 7);
			expect(result).toEqual(1);
		});
		test('Return position for 7 tiles and last at index 0', () => {
			const result = positionToStartOnPrevButton(7, streamsInMeeting, 0);
			expect(result).toEqual(3);
		});
		test('Return position for 7 tiles and last at index 1', () => {
			const result = positionToStartOnPrevButton(7, streamsInMeeting, 1);
			expect(result).toEqual(4);
		});
		test('Return position for 5 tiles and last at index 0', () => {
			const result = positionToStartOnPrevButton(5, streamsInMeeting, 0);
			expect(result).toEqual(7);
		});
		test('Return position for 5 tiles and last never set', () => {
			const result = positionToStartOnPrevButton(5, streamsInMeeting, null);
			expect(result).toEqual(7);
		});
	});
	describe('positionToStartOnNextButton', () => {
		test('Return position for 4 tiles and last at index 5', () => {
			const result = positionToStartOnNextButton(4, streamsInMeeting, 5);
			expect(result).toEqual(1);
		});
		test('Return position for 4 tiles and last at index 1', () => {
			const result = positionToStartOnNextButton(4, streamsInMeeting, 1);
			expect(result).toEqual(5);
		});
		test('Return position for 4 tiles and last at index 7', () => {
			const result = positionToStartOnNextButton(4, streamsInMeeting, 7);
			expect(result).toEqual(3);
		});
		test('Return position for 4 tiles and last at index 0', () => {
			const result = positionToStartOnNextButton(4, streamsInMeeting, 0);
			expect(result).toEqual(4);
		});
		test('Return position for 4 tiles and last never set', () => {
			const result = positionToStartOnNextButton(4, streamsInMeeting, null);
			expect(result).toEqual(4);
		});
	});
});
