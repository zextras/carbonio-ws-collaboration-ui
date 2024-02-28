/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Accordion, AccordionItemType, Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type RecordingAccordionProps = {
	meetingId: string;
};

const RecordingAccordion: FC<RecordingAccordionProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	// TODO: Add translations
	const accordionTitle = t('', `${meetingId}`);

	const items = useMemo(() => {
		const recordingContainer: AccordionItemType[] = [
			{
				id: 'waitingListContainer',
				disableHover: true,
				background: 'text',
				CustomComponent: () => (
					<Container padding={{ vertical: 'large', right: 'small' }} gap="0.5rem">
						Recording accordion
					</Container>
				)
			}
		];
		return [
			{
				id: 'recordingAccordion',
				label: accordionTitle,
				// open: accordionStatus,
				items: recordingContainer
				// onOpen: toggleAccordionStatus,
				// onClose: toggleAccordionStatus
			} as AccordionItemType
		];
	}, [accordionTitle]);

	return <CustomAccordion items={items} borderRadius="none" background="gray0" />;
};

export default RecordingAccordion;
