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
	Icon,
	Text,
	Tooltip,
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

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomIcon = styled(Icon)`
	width: 1.5rem;
	min-width: 1.5rem;
	height: 1.5rem;
	min-height: 1.5rem;
`;

type RecordingAccordionProps = {
	meetingId: string;
};

const RecordingAccordion: FC<RecordingAccordionProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const accordionTitle = t('meeting.sidebar.recording.title', 'Recording');
	const accordionDescription = t(
		'meeting.sidebar.recording.description',
		'The recording will be saved in the Files space of the moderator who stopped it.'
	);
	const startButtonLabel = t('meeting.sidebar.recording.action.start', 'Start');
	const stopButtonLabel = t('meeting.sidebar.recording.action.stop', 'Stop');
	const successSnackbarLabel = t(
		'meeting.recordingStart.successSnackbar.starter',
		'You have started the registration of this meeting'
	);
	const errorSnackbarLabel = t(
		'meeting.recordingStart.failureSnackbar',
		'It is not possible to start the registration, please contact your system administrator.'
	);
	const recordingTooltipLabel = t(
		'meeting.sidebar.recording.ifSomethingGoesWrongTooltip',
		'If something goes wrong, the recording will be saved in the Files space of the moderator who started it.'
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
		MeetingsApi.startRecording(meetingId)
			.then(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'info',
					label: successSnackbarLabel,
					hideButton: true
				});
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'warning',
					label: errorSnackbarLabel,
					hideButton: true
				});
			});
	}, [createSnackbar, errorSnackbarLabel, meetingId, successSnackbarLabel]);

	const RecordingContainer: ReactElement = useMemo(
		() => (
			<CustomContainer
				crossAlignment="flex-start"
				padding={{ vertical: 'large', right: 'small' }}
				gap="0.5rem"
			>
				<StartRecordingUser meetingId={meetingId} />
				<Container orientation="horizontal">
					{!recordingTimestamp && (
						<Button
							data-testid="startRecordingButton"
							width="fill"
							color="success"
							label={startButtonLabel}
							onClick={startRecording}
						/>
					)}
					{!!recordingTimestamp && (
						<Button
							data-testid="stopRecordingButton"
							width="fill"
							color="error"
							label={stopButtonLabel}
							onClick={openModal}
						/>
					)}
				</Container>
				<Container
					orientation="horizontal"
					height="fit"
					width="fill"
					gap="0.5rem"
					crossAlignment="flex-start"
				>
					<Tooltip label={recordingTooltipLabel}>
						<Container width="fit" height="fit">
							<CustomIcon icon="InfoOutline" />
						</Container>
					</Tooltip>
					<Text overflow="break-word">{accordionDescription}</Text>
				</Container>
			</CustomContainer>
		),
		[
			accordionDescription,
			meetingId,
			openModal,
			recordingTimestamp,
			recordingTooltipLabel,
			startButtonLabel,
			startRecording,
			stopButtonLabel
		]
	);

	const RecordingHeader = useCallback(
		({ item }: { item: AccordionItemType }): ReactElement => (
			<AccordionItem item={item}>
				{recordingTimestamp && <RecordingTimer timestamp={recordingTimestamp} />}
			</AccordionItem>
		),
		[recordingTimestamp]
	);

	const items = useMemo(() => {
		const recordingItem: AccordionItemType[] = [
			{
				id: 'recordingContainer',
				disableHover: true,
				background: 'text',
				CustomComponent: () => RecordingContainer
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
	}, [accordionTitle, accordionStatus, RecordingHeader, toggleAccordionStatus, RecordingContainer]);

	return (
		<>
			<CustomAccordion items={items} borderRadius="none" background={'gray0'} />
			<StopRecordingModal
				isOpen={isStopRecordingModalOpen}
				closeModal={closeModal}
				meetingId={meetingId}
			/>
		</>
	);
};

export default RecordingAccordion;
