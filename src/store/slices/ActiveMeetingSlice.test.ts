/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { size } from 'lodash';

import { MeetingChatVisibility, MeetingViewType } from '../../types/store/ActiveMeetingTypes';
import useStore from '../Store';

const meetingId = 'meetingId';

describe('Active Meeting Slice', () => {
	test('Add and remove active meeting', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setActiveMeeting(meetingId));

		// Check store data
		expect(size(result.current.activeMeeting)).toBe(1);
		expect(result.current.activeMeeting[meetingId].sidebarStatus).toStrictEqual({
			sidebarIsOpened: true,
			actionsAccordionIsOpened: true,
			participantsAccordionIsOpened: false
		});
		expect(result.current.activeMeeting[meetingId].chatVisibility).toBe(
			MeetingChatVisibility.CLOSED
		);
		expect(result.current.activeMeeting[meetingId].meetingViewSelected).toBe(
			MeetingViewType.WAITING
		);

		act(() => result.current.removeActiveMeeting(meetingId));
		expect(result.current.activeMeeting[meetingId]).toBeUndefined();
	});

	test('Change sidebar status', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setActiveMeeting(meetingId));

		act(() => result.current.setMeetingSidebarStatus(meetingId, false));
		expect(result.current.activeMeeting[meetingId].sidebarStatus.sidebarIsOpened).toBeFalsy();

		act(() => result.current.setMeetingSidebarStatus(meetingId, true));
		expect(result.current.activeMeeting[meetingId].sidebarStatus.sidebarIsOpened).toBeTruthy();
	});

	test('Change action accordion status', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setActiveMeeting(meetingId));

		act(() => result.current.setMeetingActionsAccordionStatus(meetingId, false));
		expect(
			result.current.activeMeeting[meetingId].sidebarStatus.actionsAccordionIsOpened
		).toBeFalsy();

		act(() => result.current.setMeetingActionsAccordionStatus(meetingId, true));
		expect(
			result.current.activeMeeting[meetingId].sidebarStatus.actionsAccordionIsOpened
		).toBeTruthy();
	});

	test('Change participants accordion status', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setActiveMeeting(meetingId));

		act(() => result.current.setMeetingParticipantsAccordionStatus(meetingId, false));
		expect(
			result.current.activeMeeting[meetingId].sidebarStatus.participantsAccordionIsOpened
		).toBeFalsy();

		act(() => result.current.setMeetingParticipantsAccordionStatus(meetingId, true));
		expect(
			result.current.activeMeeting[meetingId].sidebarStatus.participantsAccordionIsOpened
		).toBeTruthy();
	});

	test('Change chat visibility ', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setActiveMeeting(meetingId));

		act(() => result.current.setMeetingChatVisibility(meetingId, MeetingChatVisibility.CLOSED));
		expect(result.current.activeMeeting[meetingId].chatVisibility).toBe(
			MeetingChatVisibility.CLOSED
		);

		act(() => result.current.setMeetingChatVisibility(meetingId, MeetingChatVisibility.OPEN));
		expect(result.current.activeMeeting[meetingId].chatVisibility).toBe(MeetingChatVisibility.OPEN);

		act(() => result.current.setMeetingChatVisibility(meetingId, MeetingChatVisibility.EXPANDED));
		expect(result.current.activeMeeting[meetingId].chatVisibility).toBe(
			MeetingChatVisibility.EXPANDED
		);
	});
});