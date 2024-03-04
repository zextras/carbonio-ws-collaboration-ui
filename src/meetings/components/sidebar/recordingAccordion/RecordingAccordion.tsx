/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { Accordion, AccordionItemType, Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getRecordingAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type RecordingAccordionProps = {
	meetingId: string;
};

const RecordingAccordion: FC<RecordingAccordionProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	// TODO: Add translation keys
	const accordionTitle = t('', 'Recording');

	const accordionStatus = useStore((state) => getRecordingAccordionStatus(state, meetingId));
	const setAccordionStatus = useStore((state) => state.setRecordingAccordionStatus);

	const toggleAccordionStatus = useCallback(
		() => setAccordionStatus(meetingId, !accordionStatus),
		[accordionStatus, meetingId, setAccordionStatus]
	);

	const items = useMemo(() => {
		const recordingContainer: AccordionItemType[] = [
			{
				id: 'waitingListContainer',
				disableHover: true,
				background: 'text',
				CustomComponent: () => (
					<Container padding={{ vertical: 'large', right: 'small' }} gap="0.5rem">
						accordion
					</Container>
				)
			}
		];
		return [
			{
				id: 'recordingAccordion',
				label: accordionTitle,
				open: accordionStatus,
				items: recordingContainer,
				onOpen: toggleAccordionStatus,
				onClose: toggleAccordionStatus
			} as AccordionItemType
		];
	}, [accordionStatus, accordionTitle, toggleAccordionStatus]);

	return <CustomAccordion items={items} borderRadius="none" background="gray0" />;
};

export default RecordingAccordion;
