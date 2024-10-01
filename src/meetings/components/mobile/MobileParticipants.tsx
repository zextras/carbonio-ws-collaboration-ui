/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import {
	getNumberOfMeetingParticipantsByMeetingId,
	getRoomIdByMeetingId
} from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import MeetingParticipantsList from '../sidebar/ParticipantsAccordion/MeetingParticipantsList';

const MobileParticipants = ({ meetingId }: { meetingId: string }): ReactElement | null => {
	const numberOfParticipants = useStore((store) =>
		getNumberOfMeetingParticipantsByMeetingId(store, meetingId)
	);
	const [t] = useTranslation();
	const participantsTitle = t('meeting.participantsList.title', {
		defaultValue:
			numberOfParticipants === 1
				? "One meeting's participant"
				: `${numberOfParticipants} meeting's participants`,
		count: numberOfParticipants ?? 0
	});

	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));

	if (!roomId) return null;
	return (
		<Container crossAlignment="flex-start">
			<Padding all="1rem">
				<Text>{participantsTitle}</Text>
			</Padding>
			<Container height="fill" padding="1rem" background="text" mainAlignment="flex-start">
				<MeetingParticipantsList meetingId={meetingId} />
			</Container>
		</Container>
	);
};

export default MobileParticipants;
