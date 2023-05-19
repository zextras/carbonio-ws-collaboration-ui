/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Accordion, Container } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import MeetingParticipantsList from './MeetingParticipantsList';
import { getNumberOfMeetingParticipantsByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type MeetingParticipantsAccordionProps = {
	meetingId: string;
};

const MeetingParticipantsAccordion: FC<MeetingParticipantsAccordionProps> = ({ meetingId }) => {
	const [t] = useTranslation();

	const numberOfParticipants = useStore((store) =>
		getNumberOfMeetingParticipantsByMeetingId(store, meetingId)
	);

	const oneParticipantTitle = t('meeting.oneParticipantListTitle', "One meeting's participant");
	const moreParticipantsTitle = t('meeting.moreParticipantsListTitle', `meeting's participants`);

	const participantsTitle = useMemo(() => {
		if (numberOfParticipants === 1) {
			return oneParticipantTitle;
		}
		return `${numberOfParticipants} ${moreParticipantsTitle}`;
	}, [moreParticipantsTitle, numberOfParticipants, oneParticipantTitle]);

	const infoDetails = useMemo(() => {
		const arrayOfActions = [
			{
				id: '1',
				disableHover: true,
				background: 'gray6',
				label: 'title',
				CustomComponent: () => <MeetingParticipantsList meetingId={meetingId} />
			}
		];
		return [
			{
				id: 'ParticipantAccordion',
				label: participantsTitle,
				items: arrayOfActions
			}
		];
	}, [meetingId, participantsTitle]);

	return (
		<Container crossAlignment="flex-start" mainAlignment="flex-start">
			<CustomAccordion items={infoDetails} borderRadius="none" />
		</Container>
	);
};

export default MeetingParticipantsAccordion;
