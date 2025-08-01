/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, ReactElement, SetStateAction, useCallback, useMemo } from 'react';

import { Button, Container, Input, Padding } from '@zextras/carbonio-design-system';
import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import SettingsCard from './SettingsCard';
import { MeetingRecordingType } from '../../utils/localStorageUtils';

const CustomButton = styled(Button)`
	border-radius: 0.125rem;
`;

const CustomInput = styled(Input)`
	cursor: default;
	pointer-events: none;
`;

type RecordingSettingsProps = {
	recordingDefaults: MeetingRecordingType;
	setRecordingDefaults: Dispatch<SetStateAction<MeetingRecordingType>>;
};
const RecordingSettings: FC<RecordingSettingsProps> = ({
	recordingDefaults,
	setRecordingDefaults
}): ReactElement | null => {
	const [t] = useTranslation();
	const recordingSectionLabel = t('settings.recording.title', 'Recording');
	const recordingDescription = t(
		'settings.recording.description',
		'Set a custom folder where to save the recordings of the meetings you stop.'
	);
	const destinationFolderLabel = t('settings.recording.inputLabel', 'Destination folder');
	const browseLabel = t('settings.recording.browseAction', 'Browse');
	const resetLabel = t('settings.recording.resetAction', 'Reset');
	const dialogTitle = t('settings.recording.dialog.title', 'Select Folder');
	const homeFolderLabel = t('settings.recording.homeFolder', 'Home');
	const saveAction = t('action.save', 'Save');

	const [filesSelectFilesAction, filesSelectFilesActionAvailable] =
		useIntegratedFunction('select-nodes');

	const confirmAction = useCallback(
		(nodes: { id: string; name: string }[]) => {
			setRecordingDefaults({
				name: nodes[0].name,
				id: nodes[0].id
			});
		},
		[setRecordingDefaults]
	);

	const handleBrowse = useCallback(() => {
		const actionTarget = {
			title: dialogTitle,
			confirmAction,
			confirmLabel: saveAction,
			allowFiles: false,
			allowFolders: true,
			canCreateFolder: true
		};

		filesSelectFilesAction(actionTarget);
	}, [confirmAction, dialogTitle, filesSelectFilesAction, saveAction]);

	const handleReset = useCallback(() => {
		setRecordingDefaults({ name: 'Home', id: 'LOCAL_ROOT' });
	}, [setRecordingDefaults]);

	const isDefaultRoot = useMemo(() => recordingDefaults.id === 'LOCAL_ROOT', [recordingDefaults]);

	if (filesSelectFilesActionAvailable) {
		return (
			<SettingsCard title={recordingSectionLabel} description={recordingDescription}>
				<Container
					orientation="horizontal"
					width="100%"
					height="fit"
					mainAlignment="flex-start"
					data-testid="recording_settings_container"
				>
					<Container width="15.625rem">
						<CustomInput
							backgroundColor={'gray5'}
							value={isDefaultRoot ? homeFolderLabel : recordingDefaults.name}
							label={destinationFolderLabel}
							onChange={handleBrowse}
						/>
					</Container>
					<Padding left="medium" />
					<CustomButton
						width="fit"
						label={browseLabel}
						color="primary"
						type="outlined"
						onClick={handleBrowse}
					/>
					<Padding left="medium" />
					<CustomButton
						width="fit"
						label={resetLabel}
						color="secondary"
						type="outlined"
						disabled={isDefaultRoot}
						onClick={handleReset}
					/>
				</Container>
			</SettingsCard>
		);
	}
	return null;
};

export default RecordingSettings;
