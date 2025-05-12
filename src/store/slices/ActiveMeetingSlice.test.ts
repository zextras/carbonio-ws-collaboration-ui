/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';
import { size } from 'lodash';

import {
	MeetingAccordionType,
	MeetingChatVisibility,
	MeetingViewType,
	VirtualBackgroundType
} from '../../types/store/ActiveMeetingTypes';
import useStore from '../Store';

const meetingId = 'meetingId';

describe('Active Meeting Slice', () => {
	test('Add and remove active meeting', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.meetingConnection(meetingId, false, undefined, false, undefined));

		// Check store data
		expect(size(result.current.activeMeeting)).toBeDefined();
		expect(result.current.activeMeeting?.sidebarStatus).toStrictEqual({
			[MeetingAccordionType.GENERAL]: true,
			[MeetingAccordionType.PARTICIPANTS]: false,
			[MeetingAccordionType.WAITING_LIST]: true,
			[MeetingAccordionType.VISUAL_EFFECTS]: false,
			[MeetingAccordionType.RECORDING]: false,
			[MeetingAccordionType.RAISE_HAND]: true
		});
		expect(result.current.activeMeeting?.chatVisibility).toBe(MeetingChatVisibility.OPEN);
		act(() => result.current.meetingDisconnection(meetingId));
		expect(result.current.activeMeeting).toBeUndefined();
	});
	test('Meeting default view is GRID', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.meetingConnection(meetingId, false, undefined, false, undefined));
		expect(result.current.activeMeeting?.meetingViewSelected).toBe(MeetingViewType.GRID);
	});
	test('Change sidebar status', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.meetingConnection(meetingId, false, undefined, false, undefined));

		act(() => result.current.setMeetingSidebarStatus(MeetingAccordionType.GENERAL, false));
		expect(result.current.activeMeeting?.sidebarStatus[MeetingAccordionType.GENERAL]).toBeFalsy();

		act(() => result.current.setMeetingSidebarStatus(MeetingAccordionType.GENERAL, true));
		expect(result.current.activeMeeting?.sidebarStatus[MeetingAccordionType.GENERAL]).toBeTruthy();
	});

	test('Change participants accordion status', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.meetingConnection(meetingId, false, undefined, false, undefined));

		act(() => result.current.setMeetingSidebarStatus(MeetingAccordionType.PARTICIPANTS, false));
		expect(
			result.current.activeMeeting?.sidebarStatus[MeetingAccordionType.PARTICIPANTS]
		).toBeFalsy();

		act(() => result.current.setMeetingSidebarStatus(MeetingAccordionType.PARTICIPANTS, true));
		expect(
			result.current.activeMeeting?.sidebarStatus[MeetingAccordionType.PARTICIPANTS]
		).toBeTruthy();
	});

	test('Change waiting list accordion status', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.meetingConnection(meetingId, false, undefined, false, undefined));

		act(() => result.current.setMeetingSidebarStatus(MeetingAccordionType.WAITING_LIST, false));
		expect(
			result.current.activeMeeting?.sidebarStatus[MeetingAccordionType.WAITING_LIST]
		).toBeFalsy();

		act(() => result.current.setMeetingSidebarStatus(MeetingAccordionType.WAITING_LIST, true));
		expect(
			result.current.activeMeeting?.sidebarStatus[MeetingAccordionType.WAITING_LIST]
		).toBeTruthy();
	});

	test('Change recording accordion status', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.meetingConnection(meetingId, false, undefined, false, undefined));

		act(() => result.current.setMeetingSidebarStatus(MeetingAccordionType.RECORDING, false));
		expect(result.current.activeMeeting?.sidebarStatus[MeetingAccordionType.RECORDING]).toBeFalsy();

		act(() => result.current.setMeetingSidebarStatus(MeetingAccordionType.RECORDING, true));
		expect(
			result.current.activeMeeting?.sidebarStatus[MeetingAccordionType.RECORDING]
		).toBeTruthy();
	});

	test('Change chat visibility ', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.meetingConnection(meetingId, false, undefined, false, undefined));

		act(() => result.current.setMeetingChatVisibility(meetingId, MeetingChatVisibility.CLOSED));
		expect(result.current.activeMeeting?.chatVisibility).toBe(MeetingChatVisibility.CLOSED);

		act(() => result.current.setMeetingChatVisibility(meetingId, MeetingChatVisibility.OPEN));
		expect(result.current.activeMeeting?.chatVisibility).toBe(MeetingChatVisibility.OPEN);

		act(() => result.current.setMeetingChatVisibility(meetingId, MeetingChatVisibility.EXPANDED));
		expect(result.current.activeMeeting?.chatVisibility).toBe(MeetingChatVisibility.EXPANDED);
	});
	test('Change background status', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.meetingConnection(meetingId, false, undefined, false, undefined));

		act(() => result.current.setBackgroundImage(meetingId, VirtualBackgroundType.COWORKING));
		expect(result.current.activeMeeting?.virtualBackground.backgroundImage).toBe(
			VirtualBackgroundType.COWORKING
		);

		act(() => result.current.setBackgroundImage(meetingId, VirtualBackgroundType.NONE));
		expect(result.current.activeMeeting?.virtualBackground.backgroundImage).toBe(
			VirtualBackgroundType.NONE
		);
	});

	test('Change updated stream', () => {
		const streamMedia = new MediaStream();

		const { result } = renderHook(() => useStore());
		act(() => result.current.meetingConnection(meetingId, false, undefined, false, undefined));

		act(() => result.current.setBackgroundStream(meetingId, streamMedia));
		expect(result.current.activeMeeting?.virtualBackground.updatedStream).toBe(streamMedia);
	});
});
