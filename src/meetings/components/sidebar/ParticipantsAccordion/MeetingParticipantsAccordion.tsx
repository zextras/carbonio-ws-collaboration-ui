/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Accordion, AccordionItemType } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import MeetingParticipantsList from './MeetingParticipantsList';
import { getMeetingParticipantsAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfMeetingParticipantsByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingAccordionType } from '../../../../types/store/ActiveMeetingTypes';

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

	const participantsTitle = t('meeting.participantsList.title', {
		defaultValue:
			numberOfParticipants === 1
				? "One meeting's participant"
				: `${numberOfParticipants} meeting's participants`,
		count: numberOfParticipants ?? 0
	});

	const accordionStatus = useStore(getMeetingParticipantsAccordionStatus);
	const setMeetingSidebarStatus = useStore((state) => state.setMeetingSidebarStatus);

	const toggleAccordionStatus = useCallback(
		() => setMeetingSidebarStatus(MeetingAccordionType.PARTICIPANTS, !accordionStatus),
		[accordionStatus, setMeetingSidebarStatus]
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
		<CustomAccordion
			items={infoDetails}
			borderRadius="none"
			background={'gray0'}
			data-testid="MeetingParticipantsAccordion"
		/>
	);
};

export default MeetingParticipantsAccordion;
