/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Accordion,
	AccordionItemType,
	Button,
	Container,
	Text
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import StopRecordingModal from './StopRecordingModal';
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
	const accordionDescription = t('', 'How the recording works');
	const startButtonLabel = t('', 'Start');
	const stopButtonLabel = t('', 'Stop');

	const accordionStatus = useStore((state) => getRecordingAccordionStatus(state, meetingId));
	const setAccordionStatus = useStore((state) => state.setRecordingAccordionStatus);

	// TODO: link to store when APIs are available
	const [recordingStatus, setRecordingStatus] = useState(false);
	const [isStopRecordingModalOpen, setIsStopRecordingModalOpen] = useState(false);

	const openModal = useCallback(() => setIsStopRecordingModalOpen(true), []);

	const closeModal = useCallback(() => setIsStopRecordingModalOpen(false), []);

	const toggleAccordionStatus = useCallback(
		() => setAccordionStatus(meetingId, !accordionStatus),
		[accordionStatus, meetingId, setAccordionStatus]
	);

	const startRecording = useCallback(() => {
		// TODO
		// MeetingsApi.startRecording(meetingId, recordingName, path);
		setRecordingStatus(true);
	}, []);

	const items = useMemo(() => {
		const recordingContainer: AccordionItemType[] = [
			{
				id: 'recordingContainer',
				disableHover: true,
				background: 'text',
				CustomComponent: () => (
					<Container
						crossAlignment="flex-start"
						padding={{ vertical: 'large', right: 'small' }}
						gap="0.5rem"
					>
						<Container orientation="horizontal" gap="0.5rem">
							<Button
								width="fill"
								color="success"
								label={startButtonLabel}
								onClick={startRecording}
								disabled={recordingStatus}
							/>
							<Button
								width="fill"
								color="error"
								label={stopButtonLabel}
								onClick={openModal}
								disabled={!recordingStatus}
							/>
						</Container>
						<Text>{accordionDescription}</Text>
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
	}, [
		accordionDescription,
		accordionStatus,
		accordionTitle,
		recordingStatus,
		startButtonLabel,
		startRecording,
		stopButtonLabel,
		openModal,
		toggleAccordionStatus
	]);

	return (
		<>
			<CustomAccordion items={items} borderRadius="none" background="gray0" />
			<StopRecordingModal
				isOpen={isStopRecordingModalOpen}
				closeModal={closeModal}
				meetingId={meetingId}
			/>
		</>
	);
};

export default RecordingAccordion;
