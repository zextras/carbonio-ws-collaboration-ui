/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, SetStateAction, useCallback } from 'react';

import { Checkbox, Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import RecordingSettings from './RecordingSettings';
import { getCapability } from './store/selectors/SessionSelectors';
import useStore from './store/Store';
import { MeetingStorageType } from './types/generics';
import { CapabilityType } from './types/store/SessionTypes';

type MeetingSettingsProps = {
	meetingMediaDefaults: MeetingStorageType;
	setMeetingMediaDefaults: Dispatch<SetStateAction<MeetingStorageType>>;
	recordingDefaults: { name: string; id: string };
	setRecordingDefaults: Dispatch<SetStateAction<{ name: string; id: string }>>;
};

const MeetingSettings: FC<MeetingSettingsProps> = ({
	meetingMediaDefaults,
	setMeetingMediaDefaults,
	recordingDefaults,
	setRecordingDefaults
}) => {
	const [t] = useTranslation();
	const meetingSectionLabel = t('', 'Meetings');
	const enableMicLabel = t('meeting.interactions.enableMicrophone', 'Enable microphone');
	const enableCamLabel = t('meeting.interactions.enableCamera', 'Enable camera');
	const meetingSectionDescription = t(
		'',
		'Set your audio and video preferences to enter the meetings. You can always customize your preferences before joining every meeting.'
	);

	const canRecordVideo = useStore((store) =>
		getCapability(store, CapabilityType.CAN_VIDEO_CALL_RECORD)
	);

	const setMicrophoneEnabled = useCallback(() => {
		setMeetingMediaDefaults((prevState) => ({
			...prevState,
			EnableMicrophone: !prevState.EnableMicrophone
		}));
	}, [setMeetingMediaDefaults]);

	const setCameraEnabled = useCallback(() => {
		setMeetingMediaDefaults((prevState) => ({
			...prevState,
			EnableCamera: !prevState.EnableCamera
		}));
	}, [setMeetingMediaDefaults]);

	return (
		<Container
			background={'gray6'}
			padding={{ horizontal: 'medium', bottom: 'medium' }}
			data-testid="meeting_settings_container"
		>
			<Container crossAlignment="flex-start" gap="1rem">
				<Padding top="large">
					<Text weight="bold">{meetingSectionLabel}</Text>
				</Padding>
				<Divider color="gray2" />
				<Container mainAlignment="flex-start" crossAlignment="flex-start" gap="1rem">
					<Text overflow="break-word" size={'small'}>
						{meetingSectionDescription}
					</Text>
					<Checkbox
						defaultChecked={meetingMediaDefaults.EnableMicrophone}
						value={meetingMediaDefaults.EnableMicrophone}
						onClick={setMicrophoneEnabled}
						label={enableMicLabel}
						data-testid="microphone_checkbox"
					/>
					<Checkbox
						defaultChecked={meetingMediaDefaults.EnableCamera}
						value={meetingMediaDefaults.EnableCamera}
						onClick={setCameraEnabled}
						label={enableCamLabel}
						data-testid="camera_checkbox"
					/>
				</Container>
				{canRecordVideo && (
					<RecordingSettings
						recordingDefaults={recordingDefaults}
						setRecordingDefaults={setRecordingDefaults}
					/>
				)}
			</Container>
		</Container>
	);
};

export default MeetingSettings;
