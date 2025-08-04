/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Accordion, AccordionItemType } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import VisualEffectsList from './VisualEffectsList';
import { getVisualEffectsAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingAccordionType } from '../../../../types/store/ActiveMeetingTypes';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

const VisualEffectsAccordion: FC = () => {
	const [t] = useTranslation();
	const accordionLabel = t('meeting.visualEffects.title', 'Visual Effects');

	const accordionStatus = useStore(getVisualEffectsAccordionStatus);
	const setMeetingSidebarStatus = useStore((state) => state.setMeetingSidebarStatus);

	const toggleAccordionStatus = useCallback(
		() => setMeetingSidebarStatus(MeetingAccordionType.VISUAL_EFFECTS, !accordionStatus),
		[accordionStatus, setMeetingSidebarStatus]
	);

	const list = useMemo(() => <VisualEffectsList />, []);

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
