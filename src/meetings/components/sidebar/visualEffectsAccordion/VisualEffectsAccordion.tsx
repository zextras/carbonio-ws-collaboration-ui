/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { Accordion, AccordionItemType } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import VisualEffectsList from './VisualEffectsList';
import { getVisualEffectsAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type VisualEffectsAccordionProps = {
	meetingId: string;
};

const VisualEffectsAccordion: FC<VisualEffectsAccordionProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const accordionLabel = t('meeting.visualEffects.title', 'Visual Effects');

	const accordionStatus = useStore(getVisualEffectsAccordionStatus);
	const setVisualEffectsAccordionStatus = useStore(
		(state) => state.setVisualEffectsAccordionStatus
	);

	const toggleAccordionStatus = useCallback(
		() => setVisualEffectsAccordionStatus(meetingId, !accordionStatus),
		[accordionStatus, meetingId, setVisualEffectsAccordionStatus]
	);

	const list = useMemo(() => <VisualEffectsList meetingId={meetingId} />, [meetingId]);

	const items = useMemo<AccordionItemType[]>(() => {
		const arrayOfActions: AccordionItemType[] = [
			{
				id: '1',
				disableHover: true,
				background: 'text',
				label: 'title',
				CustomComponent: () => list
			}
		];
		return [
			{
				id: 'ParticipantAccordion',
				label: accordionLabel,
				open: accordionStatus,
				items: arrayOfActions,
				onOpen: toggleAccordionStatus,
				onClose: toggleAccordionStatus
			}
		];
	}, [accordionLabel, accordionStatus, list, toggleAccordionStatus]);

	return <CustomAccordion items={items} borderRadius="none" background={'gray0'} />;
};

export default VisualEffectsAccordion;
