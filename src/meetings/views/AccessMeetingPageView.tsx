/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MEETINGS_PATH } from '../../constants/appConstants';
import { getRoomExistsSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import AccessMeetingModal from '../components/AccessMeetingModal';

const AccessMeetingPageView = (): ReactElement => {
	// Retrieve room information
	const roomId: string = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const areRoomsDataAvailable = useStore(({ connections }) => connections.status.chats_be);
	const canUserAccessToRoom = useStore((store) => getRoomExistsSelector(store, roomId));

	const AccessComponent = useMemo(
		() => (canUserAccessToRoom ? <AccessMeetingModal roomId={roomId} /> : <div>Waiting room</div>),
		[canUserAccessToRoom, roomId]
	);

	return <Container background="gray0">{areRoomsDataAvailable && AccessComponent}</Container>;
};

export default AccessMeetingPageView;
