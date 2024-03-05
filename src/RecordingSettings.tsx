/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, ReactElement, SetStateAction, useCallback, useMemo } from 'react';

import { Button, Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

const CustomButton = styled(Button)`
	border-radius: 0.125rem;
`;

type RecordingSettingsProps = {
	recordingDefaults: { name: string; id: string };
	setRecordingDefaults: Dispatch<SetStateAction<{ name: string; id: string }>>;
};
const RecordingSettings: FC<RecordingSettingsProps> = ({
	recordingDefaults,
	setRecordingDefaults
}): ReactElement | null => {
	const [filesSelectFilesAction, filesSelectFilesActionAvailable] =
		useIntegratedFunction('select-nodes');

	const confirmAction = useCallback(
		(nodes) => {
			setRecordingDefaults({
				name: nodes[0].id === 'LOCAL_ROOT' ? 'Home' : nodes[0].name,
				id: nodes[0].id
			});
		},
		[setRecordingDefaults]
	);

	const handleBrowse = useCallback(() => {
		const actionTarget = {
			title: 'Select folder',
			confirmAction,
			confirmLabel: 'Save',
			allowFiles: false,
			allowFolders: true,
			canCreateFolder: true
		};

		filesSelectFilesAction(actionTarget);
	}, [confirmAction, filesSelectFilesAction]);

	const handleReset = useCallback(() => {
		setRecordingDefaults({ name: 'Home', id: 'LOCAL_ROOT' });
	}, [setRecordingDefaults]);

	const isRootDefault = useMemo(() => recordingDefaults.name === 'Home', [recordingDefaults]);

	if (filesSelectFilesActionAvailable) {
		return (
			<Container crossAlignment="flex-start" gap="1rem">
				<Text weight="bold">Recording</Text>
				<Container orientation="horizontal" width="100%" height="fit" mainAlignment="flex-start">
					<Container width="15.625rem">
						<Input
							backgroundColor={'gray5'}
							value={recordingDefaults.name}
							disabled={isRootDefault}
							label="Destination folder"
						/>
					</Container>
					<Padding left="medium" />
					<CustomButton
						width="fit"
						label="browse"
						color="primary"
						type="outlined"
						onClick={handleBrowse}
					/>
					<Padding left="medium" />
					<CustomButton
						width="fit"
						label="reset"
						color="secondary"
						type="outlined"
						onClick={handleReset}
					/>
				</Container>
				<Text size="small" overflow="break-word">
					Set a custom folder where to save the recordings of the meetings you stop.
				</Text>
			</Container>
		);
	}
	return null;
};

export default RecordingSettings;
