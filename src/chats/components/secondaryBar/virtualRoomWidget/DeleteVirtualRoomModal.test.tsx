/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import DeleteVirtualRoomModal from './DeleteVirtualRoomModal';
import * as api from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';

const sessionUser = createMockUser({ id: 'sessionId', name: 'Session User' });

const temporaryRoomMod: RoomBe = createMockRoom({
	id: 'temporary-mod-room-test',
	type: RoomType.TEMPORARY,
	name: 'Temporary mod room',
	members: [createMockMember({ userId: sessionUser.id, owner: true })]
});

const scheduledMeetingMod: MeetingBe = createMockMeeting({
	id: 'scheduled-meeting-mod-test',
	roomId: temporaryRoomMod.id
});

describe('SelectVirtualRoomWidget', () => {
	test('Should render properly - user has virtual rooms', async () => {
		const spyOnDeleteRoomAndMeeting = vi.spyOn(api, 'deleteRoomAndMeeting');
		act(() => {
			const store = useStore.getState();
			store.setLoginInfo({ id: sessionUser.id, name: sessionUser.name });
			store.setAttributes(createMockAttributesList());
			store.addRooms([temporaryRoomMod]);
			store.addMeetings([scheduledMeetingMod]);
		});
		const { user } = setup(
			<DeleteVirtualRoomModal
				showModal
				handleModalOpening={() => {}}
				setShowModal={() => {}}
				modalRef={React.createRef<HTMLDivElement>()}
				roomId={temporaryRoomMod.id}
			/>
		);

		const deleteButton = screen.getByRole('button', { name: /Delete/i });

		await user.click(deleteButton);

		expect(spyOnDeleteRoomAndMeeting).toHaveBeenCalled();
	});
});
