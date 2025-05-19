/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	MeetingAccordionType,
	MeetingChatVisibility,
	MeetingViewType,
	STREAM_TYPE,
	VirtualBackgroundType
} from '../../types/store/ActiveMeetingTypes';
import useStore from '../Store';

const meetingId = 'meetingId';

describe('Active Meeting Slice', () => {
	test('Add and remove active meeting', () => {
		useStore.getState().meetingConnection(meetingId);

		// Check store data
		const store = useStore.getState();
		expect(store.activeMeeting).toBeDefined();
		expect(store.activeMeeting?.meetingId).toBe(meetingId);
		expect(store.activeMeeting?.chatVisibility).toBe(MeetingChatVisibility.OPEN);

		useStore.getState().meetingDisconnection(meetingId);
		expect(useStore.getState().activeMeeting).toBeUndefined();
	});

	describe('Local streams', () => {
		test('Set local audio stream', () => {
			const streamMedia = new MediaStream();
			useStore.getState().meetingConnection(meetingId);
			useStore.getState().setLocalStreams(STREAM_TYPE.AUDIO, streamMedia);
			expect(useStore.getState().activeMeeting?.localStreams.audio).toBe(streamMedia);
		});

		test('Set local video stream', () => {
			const streamMedia = new MediaStream();
			useStore.getState().meetingConnection(meetingId);
			useStore.getState().setLocalStreams(STREAM_TYPE.VIDEO, streamMedia);
			expect(useStore.getState().activeMeeting?.localStreams.video).toBe(streamMedia);
		});

		test('Set local screen stream', () => {
			const streamMedia = new MediaStream();
			useStore.getState().meetingConnection(meetingId);
			useStore.getState().setLocalStreams(STREAM_TYPE.SCREEN, streamMedia);
			expect(useStore.getState().activeMeeting?.localStreams.screen).toBe(streamMedia);
		});

		test('Remove local audio stream', () => {
			const streamMedia = new MediaStream();
			useStore.getState().meetingConnection(meetingId);
			useStore.getState().setLocalStreams(STREAM_TYPE.AUDIO, streamMedia);
			expect(useStore.getState().activeMeeting?.localStreams.audio).toBe(streamMedia);
			useStore.getState().removeLocalStreams(STREAM_TYPE.AUDIO);
			expect(useStore.getState().activeMeeting?.localStreams.audio).toBeUndefined();
		});

		test('Set audio device', () => {
			const deviceId = 'deviceId';
			useStore.getState().meetingConnection(meetingId);
			useStore.getState().setSelectedDeviceId(STREAM_TYPE.AUDIO, deviceId);
			expect(useStore.getState().activeMeeting?.localStreams.selectedAudioDeviceId).toBe(deviceId);
		});

		test('Set video device', () => {
			const deviceId = 'deviceId';
			useStore.getState().meetingConnection(meetingId);
			useStore.getState().setSelectedDeviceId(STREAM_TYPE.VIDEO, deviceId);
			expect(useStore.getState().activeMeeting?.localStreams.selectedVideoDeviceId).toBe(deviceId);
		});
	});

	beforeEach(() => {
		useStore.getState().meetingConnection(meetingId);
	});
	describe('Sidebar accordions status', () => {
		test('Default sidebar accordions status', () => {
			expect(useStore.getState().activeMeeting?.sidebarStatus).toStrictEqual({
				[MeetingAccordionType.GENERAL]: true,
				[MeetingAccordionType.PARTICIPANTS]: false,
				[MeetingAccordionType.WAITING_LIST]: true,
				[MeetingAccordionType.VISUAL_EFFECTS]: false,
				[MeetingAccordionType.RECORDING]: false,
				[MeetingAccordionType.RAISE_HAND]: true
			});
		});

		test('Set sidebar accordions status', () => {
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.GENERAL, false);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.GENERAL]
			).toBeFalsy();
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.GENERAL, true);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.GENERAL]
			).toBeTruthy();
		});

		test('Set participant accordion status', () => {
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.PARTICIPANTS, false);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.PARTICIPANTS]
			).toBeFalsy();
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.PARTICIPANTS, true);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.PARTICIPANTS]
			).toBeTruthy();
		});

		test('Set waiting list accordion status', () => {
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.WAITING_LIST, false);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.WAITING_LIST]
			).toBeFalsy();
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.WAITING_LIST, true);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.WAITING_LIST]
			).toBeTruthy();
		});

		test('Set recording accordion status', () => {
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.RECORDING, false);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.RECORDING]
			).toBeFalsy();
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.RECORDING, true);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.RECORDING]
			).toBeTruthy();
		});

		test('Set visual effects accordion status', () => {
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.VISUAL_EFFECTS, false);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.VISUAL_EFFECTS]
			).toBeFalsy();
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.VISUAL_EFFECTS, true);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.VISUAL_EFFECTS]
			).toBeTruthy();
		});

		test('Set raise hand accordion status', () => {
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.RAISE_HAND, false);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.RAISE_HAND]
			).toBeFalsy();
			useStore.getState().setMeetingSidebarStatus(MeetingAccordionType.RAISE_HAND, true);
			expect(
				useStore.getState().activeMeeting?.sidebarStatus[MeetingAccordionType.RAISE_HAND]
			).toBeTruthy();
		});
	});

	describe('Chat visibility', () => {
		test('Default chat visibility', () => {
			expect(useStore.getState().activeMeeting?.chatVisibility).toBe(MeetingChatVisibility.OPEN);
		});

		test('Set chat visibility to OPEN', () => {
			useStore.getState().setMeetingChatVisibility(MeetingChatVisibility.OPEN);
			expect(useStore.getState().activeMeeting?.chatVisibility).toBe(MeetingChatVisibility.OPEN);
		});

		test('Set chat visibility to CLOSED', () => {
			useStore.getState().setMeetingChatVisibility(MeetingChatVisibility.CLOSED);
			expect(useStore.getState().activeMeeting?.chatVisibility).toBe(MeetingChatVisibility.CLOSED);
		});

		test('Set chat visibility to EXPANDED', () => {
			useStore.getState().setMeetingChatVisibility(MeetingChatVisibility.EXPANDED);
			expect(useStore.getState().activeMeeting?.chatVisibility).toBe(
				MeetingChatVisibility.EXPANDED
			);
		});
	});

	describe('Meeting view', () => {
		test('Set GRID view', () => {
			useStore.getState().setMeetingViewSelected(MeetingViewType.GRID);
			expect(useStore.getState().activeMeeting?.meetingViewSelected).toBe(MeetingViewType.GRID);
		});

		test('Set CINEMA view', () => {
			useStore.getState().setMeetingViewSelected(MeetingViewType.CINEMA);
			expect(useStore.getState().activeMeeting?.meetingViewSelected).toBe(MeetingViewType.CINEMA);
		});
	});

	describe('Carousel visibility', () => {
		test('Default carousel visibility', () => {
			expect(useStore.getState().activeMeeting?.isCarouselVisible).toBe(true);
		});

		test('Set carousel visibility to false', () => {
			useStore.getState().setIsCarouseVisible(false);
			expect(useStore.getState().activeMeeting?.isCarouselVisible).toBe(false);
		});

		test('Set carousel visibility to true', () => {
			useStore.getState().setIsCarouseVisible(true);
			expect(useStore.getState().activeMeeting?.isCarouselVisible).toBe(true);
		});
	});

	describe('Talking users', () => {
		test('Default talking users', () => {
			expect(useStore.getState().activeMeeting?.talkingUsers).toStrictEqual([]);
		});

		test('Add talking users', () => {
			useStore.getState().setTalkingUser('userId1', true);
			useStore.getState().setTalkingUser('userId2', true);
			expect(useStore.getState().activeMeeting?.talkingUsers).toStrictEqual(['userId1', 'userId2']);
		});

		test('Remove talking user', () => {
			const userId = 'userId';
			useStore.getState().setTalkingUser(userId, true);
			expect(useStore.getState().activeMeeting?.talkingUsers).toStrictEqual([userId]);

			useStore.getState().setTalkingUser(userId, false);
			expect(useStore.getState().activeMeeting?.talkingUsers).toStrictEqual([]);
		});
	});

	describe('Virtual background', () => {
		test('Default virtual background', () => {
			expect(useStore.getState().activeMeeting?.virtualBackground).toStrictEqual({
				backgroundImage: VirtualBackgroundType.NONE
			});
		});

		test('Set background stream', () => {
			const streamMedia = new MediaStream();
			useStore.getState().setBackgroundStream(streamMedia);
			expect(useStore.getState().activeMeeting?.virtualBackground.updatedStream).toBe(streamMedia);
		});

		test('Remove background stream', () => {
			const streamMedia = new MediaStream();
			useStore.getState().setBackgroundStream(streamMedia);
			expect(useStore.getState().activeMeeting?.virtualBackground.updatedStream).toBe(streamMedia);

			useStore.getState().removeBackgroundStream();
			expect(useStore.getState().activeMeeting?.virtualBackground.updatedStream).toBeUndefined();
		});

		test('Set virtual background', () => {
			useStore.getState().setBackgroundImage(VirtualBackgroundType.COWORKING);
			expect(useStore.getState().activeMeeting?.virtualBackground.backgroundImage).toBe(
				VirtualBackgroundType.COWORKING
			);

			useStore.getState().setBackgroundImage(VirtualBackgroundType.BLUR);
			expect(useStore.getState().activeMeeting?.virtualBackground.backgroundImage).toBe(
				VirtualBackgroundType.BLUR
			);
		});
	});

	describe('Users with raised hands', () => {
		test('Default raised hands', () => {
			expect(useStore.getState().activeMeeting?.usersWithHandRaised).toStrictEqual([]);
		});

		test('Add raised hands', () => {
			useStore.getState().setUserWithHandRaised('userId1', true);
			useStore.getState().setUserWithHandRaised('userId2', true);
			expect(useStore.getState().activeMeeting?.usersWithHandRaised).toStrictEqual([
				'userId1',
				'userId2'
			]);
		});

		test('Remove raised hand', () => {
			const userId = 'userId';
			useStore.getState().setUserWithHandRaised(userId, true);
			expect(useStore.getState().activeMeeting?.usersWithHandRaised).toStrictEqual([userId]);

			useStore.getState().setUserWithHandRaised(userId, false);
			expect(useStore.getState().activeMeeting?.usersWithHandRaised).toStrictEqual([]);
		});
	});
});
