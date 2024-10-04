/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useTilesOrder from '../../../hooks/useTilesOrder';
import useStore from '../../../store/Store';
import { STREAM_TYPE, Subscription } from '../../../types/store/ActiveMeetingTypes';
import Tile from '../tile/Tile';

const MobileTilesView = ({ meetingId }: { meetingId: string }): ReactElement | null => {
	const [t] = useTranslation();
	const waitingParticipants = t(
		'meeting.waitingParticipants',
		'Waiting for participants to join...'
	);

	const { centralTile } = useTilesOrder(meetingId);

	const setUpdateSubscription = useStore((store) => store.setUpdateSubscription);

	useEffect(() => {
		if (centralTile) {
			const subscription: Subscription = { userId: centralTile.userId, type: centralTile.type };
			setUpdateSubscription(meetingId, [subscription]);
		}
	}, [centralTile, meetingId, setUpdateSubscription]);

	return (
		<Container data-testid="mobile_skeleton_view">
			{centralTile ? (
				<Tile
					userId={centralTile.userId}
					meetingId={meetingId}
					isScreenShare={centralTile.type === STREAM_TYPE.SCREEN}
				/>
			) : (
				<Text color="gray6" size="large">
					{waitingParticipants}
				</Text>
			)}
		</Container>
	);
};

export default MobileTilesView;
