/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import TileUserInfo from './TileUserInfo';
import useStore from '../../../store/Store';
import { createMockMeeting } from '../../../tests/createMock';
import { screen, setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';

const mockMeeting: MeetingBe = createMockMeeting();
const REMOTE_USER_ID = 'remote-user';
const MY_USER_ID = 'my-user';

const defaultProps = {
	meetingId: mockMeeting.id,
	userId: REMOTE_USER_ID,
	videoStreamEnabled: true,
	audioStreamEnabled: true,
	isScreenShare: false,
	isHandRaised: false
};

beforeEach(() => {
	const store = useStore.getState();
	store.addMeetings([mockMeeting]);
	store.meetingConnection(mockMeeting.id);
});

describe('TileUserInfo — tier indicators', () => {
	it('shows no tier indicators when video is off', () => {
		const { container } = setup(<TileUserInfo {...defaultProps} videoStreamEnabled={false} />);
		expect(container.querySelector('[data-testid="icon: ArrowUp"]')).toBeNull();
		expect(container.querySelector('[data-testid="icon: ArrowDown"]')).toBeNull();
	});

	it('shows no tier indicators for screenshare tiles', () => {
		const { container } = setup(<TileUserInfo {...defaultProps} isScreenShare />);
		expect(container.querySelector('[data-testid="icon: ArrowUp"]')).toBeNull();
	});

	it('shows UP tier indicator on own tile when maxTier is set', () => {
		useStore.getState().setLoginInfo({ id: MY_USER_ID });
		useStore
			.getState()
			.setParticipantConnectionQuality(mockMeeting.id, MY_USER_ID, 'optimal', 1, 2);
		setup(<TileUserInfo {...defaultProps} userId={MY_USER_ID} />);
		expect(screen.getByTestId('icon: ArrowUp')).toBeInTheDocument();
		expect(screen.queryByTestId('icon: ArrowDown')).toBeNull();
	});

	it('shows UP+DOWN tier indicators on remote tile when tiers are set', () => {
		useStore
			.getState()
			.setParticipantConnectionQuality(mockMeeting.id, REMOTE_USER_ID, 'optimal', 1, 1);
		useStore.getState().setReceivedWebcamTier(mockMeeting.id, REMOTE_USER_ID, 0);
		setup(<TileUserInfo {...defaultProps} />);
		expect(screen.getByTestId('icon: ArrowUp')).toBeInTheDocument();
		expect(screen.getByTestId('icon: ArrowDown')).toBeInTheDocument();
	});
});
