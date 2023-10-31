/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { Accordion, AccordionItemType, Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import MeetingParticipantsList from './MeetingParticipantsList';
import { getMeetingParticipantsAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
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

	const participantsTitle = t(
		'meeting.participantsList.title',
		"{{count}} meeting's participants",
		{ count: numberOfParticipants !== undefined ? numberOfParticipants : 0 }
	);

	const accordionStatus: boolean = useStore((state) =>
		getMeetingParticipantsAccordionStatus(state, meetingId)
	);
	const setParticipantsAccordionStatus = useStore(
		(state) => state.setMeetingParticipantsAccordionStatus
	);

	const toggleAccordionStatus = useCallback(
		() => setParticipantsAccordionStatus(meetingId, !accordionStatus),
		[accordionStatus, meetingId, setParticipantsAccordionStatus]
	);

	const infoDetails = useMemo<AccordionItemType[]>(() => {
		const arrayOfActions: AccordionItemType[] = [
			{
				id: '1',
				disableHover: true,
				background: 'text',
				label: 'title',
				CustomComponent: () => <MeetingParticipantsList meetingId={meetingId} />
			}
		];
		return [
			{
				id: 'ParticipantAccordion',
				label: participantsTitle,
				open: accordionStatus,
				items: arrayOfActions,
				onOpen: toggleAccordionStatus,
				onClose: toggleAccordionStatus
			}
		];
	}, [accordionStatus, meetingId, participantsTitle, toggleAccordionStatus]);

	return (
		<Container
			data-testid="MeetingParticipantsAccordion"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
		>
			<CustomAccordion items={infoDetails} borderRadius="none" background="gray0" />
		</Container>
	);
};

export default MeetingParticipantsAccordion;
