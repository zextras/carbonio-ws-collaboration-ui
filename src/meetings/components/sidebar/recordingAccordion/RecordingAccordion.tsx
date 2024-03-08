/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import {
	Accordion,
	AccordionItem,
	AccordionItemType,
	Button,
	Container,
	CreateSnackbarFn,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import RecordingTimer from './RecordingTimer';
import StartRecordingUser from './StartRecordingUser';
import StopRecordingModal from './StopRecordingModal';
import { MeetingsApi } from '../../../../network';
import { getRecordingAccordionStatus } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getMeetingRecordingTimestamp } from '../../../../store/selectors/MeetingSelectors';
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
	const errorSnackbarLabel = t(
		'',
		'It is not possible to start the registration, please contact your system administrator.'
	);

	const recordingTimestamp = useStore((state) => getMeetingRecordingTimestamp(state, meetingId));
	const accordionStatus = useStore((state) => getRecordingAccordionStatus(state, meetingId));
	const setAccordionStatus = useStore((state) => state.setRecordingAccordionStatus);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const [isStopRecordingModalOpen, setIsStopRecordingModalOpen] = useState(false);

	const openModal = useCallback(() => setIsStopRecordingModalOpen(true), []);

	const closeModal = useCallback(() => setIsStopRecordingModalOpen(false), []);

	const toggleAccordionStatus = useCallback(
		() => setAccordionStatus(meetingId, !accordionStatus),
		[accordionStatus, meetingId, setAccordionStatus]
	);

	const startRecording = useCallback(() => {
		MeetingsApi.startRecording(meetingId).catch(() => {
			createSnackbar({
				key: new Date().toLocaleString(),
				type: 'warning',
				label: errorSnackbarLabel,
				hideButton: true
			});
		});
	}, [createSnackbar, errorSnackbarLabel, meetingId]);

	const items = useMemo(() => {
		const RecordingHeader = ({ item }: { item: AccordionItemType }): ReactElement => (
			<AccordionItem item={item}>
				{recordingTimestamp && <RecordingTimer timestamp={recordingTimestamp} />}
			</AccordionItem>
		);
		const RecordingContainer = (): ReactElement => (
			<Container
				crossAlignment="flex-start"
				padding={{ vertical: 'large', right: 'small' }}
				gap="0.5rem"
			>
				<StartRecordingUser meetingId={meetingId} />
				<Container orientation="horizontal" gap="0.5rem">
					<Button
						data-testid="startRecordingButton"
						width="fill"
						color="success"
						label={startButtonLabel}
						onClick={startRecording}
						disabled={!!recordingTimestamp}
					/>
					<Button
						data-testid="stopRecordingButton"
						width="fill"
						color="error"
						label={stopButtonLabel}
						onClick={openModal}
						disabled={!recordingTimestamp}
					/>
				</Container>
				<Text>{accordionDescription}</Text>
			</Container>
		);

		const recordingItem: AccordionItemType[] = [
			{
				id: 'recordingContainer',
				disableHover: true,
				background: 'text',
				CustomComponent: RecordingContainer
			}
		];
		return [
			{
				id: 'recordingAccordion',
				label: accordionTitle,
				open: accordionStatus,
				CustomComponent: RecordingHeader,
				items: recordingItem,
				onOpen: toggleAccordionStatus,
				onClose: toggleAccordionStatus
			} as AccordionItemType
		];
	}, [
		accordionTitle,
		accordionStatus,
		toggleAccordionStatus,
		recordingTimestamp,
		meetingId,
		startButtonLabel,
		startRecording,
		stopButtonLabel,
		openModal,
		accordionDescription
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
