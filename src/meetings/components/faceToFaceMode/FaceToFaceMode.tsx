/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getFirstParticipant } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import Tile from '../Tile';

const FaceToFace = styled(Container)`
	position: relative;
	min-width: 18rem;
`;

const MyStreamContainer = styled(Container)`
	position: absolute;
	top: -3.25rem;
	right: -3.25rem;
	transition: opacity 200ms linear;
	z-index: 10;
	width: 16rem;
	height: 9rem;
	border-radius: 0.5rem;
	&:hover {
		opacity: 0;
	}
`;

const FaceToFaceMode = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	const waitingParticipants = t(
		'meeting.waitingParticipants',
		'Waiting for participants to join...'
	);

	const localId = useStore(getUserId);
	const centralParticipant = useStore((store) => getFirstParticipant(store, meetingId));

	const centralContentToDisplay = useMemo(
		() =>
			centralParticipant ? (
				<Tile userId={centralParticipant.userId} meetingId={meetingId} />
			) : (
				<Text color="gray6" size="large">
					{waitingParticipants}
				</Text>
			),
		[centralParticipant, meetingId, waitingParticipants]
	);

	return (
		<FaceToFace data-testid="faceToFaceModeView">
			<MyStreamContainer data-testid="myStreamContainer" background="text">
				<Tile userId={localId} meetingId={meetingId} />
			</MyStreamContainer>
			{centralContentToDisplay}
		</FaceToFace>
	);
};

export default FaceToFaceMode;
