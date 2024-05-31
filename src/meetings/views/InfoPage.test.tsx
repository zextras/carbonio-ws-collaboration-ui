/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import InfoPage from './InfoPage';
import { useParams } from '../../../__mocks__/react-router';
import { PAGE_INFO_TYPE } from '../../hooks/useRouting';
import useStore from '../../store/Store';
import { createMockUser } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { UserType } from '../../types/store/UserTypes';

const pages = [
	[PAGE_INFO_TYPE.ROOM_EMPTY, 'This Room is empty', 'Try later', 'It seems nobody is in this Room'],
	[
		PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION,
		'This meeting is already open in another window',
		'Continue the meeting in the new window',
		'There cannot be more than one active session of the same meeting'
	],
	[
		PAGE_INFO_TYPE.HANG_UP_PAGE,
		'You left the waiting room',
		'Maybe next time',
		'We look forward to seeing you participate in future meetings'
	],
	[
		PAGE_INFO_TYPE.UNAUTHENTICATED,
		'You are not authenticated',
		'login to access the meeting',
		'You cannot join the meeting if you are not authenticated with your account'
	]
];

const pagesToCheckGuest = [
	[
		PAGE_INFO_TYPE.MEETING_NOT_FOUND,
		'The meeting you are looking for does not exist',
		'Try later',
		'Please check the meeting link and try again'
	],
	[
		PAGE_INFO_TYPE.NEXT_TIME_PAGE,
		'Your access has been refused',
		'Maybe next time',
		'The moderators have decided to deny your access to the meeting'
	],
	[
		PAGE_INFO_TYPE.MEETING_ENDED,
		'Meeting Ended',
		'Thanks for participating',
		"Keep in touch with your colleagues or join your groups' meeting rooms"
	]
];

describe('Info page', () => {
	test.each([...pages, ...pagesToCheckGuest])(
		'Display %s info page',
		async (type, title, central, desc) => {
			useParams.mockReturnValueOnce({ infoType: type });
			setup(<InfoPage />);

			expect(await screen.findByText(title)).toBeVisible();
			expect(await screen.findByText(central)).toBeVisible();
			expect(await screen.findByText(desc)).toBeVisible();
		}
	);
	test.each(pagesToCheckGuest)('Display %s info page, user is guest', async (type) => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		const guestUser = createMockUser({ type: UserType.GUEST });
		const store = useStore.getState();
		store.setLoginInfo(guestUser.id, guestUser.name, guestUser.name, guestUser.type);
		useParams.mockReturnValueOnce({ infoType: type });
		setup(<InfoPage />);

		expect(document.cookie).toBe('');
	});
});
