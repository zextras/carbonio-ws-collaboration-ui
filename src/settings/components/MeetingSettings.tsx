/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, SetStateAction, useCallback } from 'react';

import { Checkbox, Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import SettingsCard from './SettingsCard';
import { MeetingStorageType } from '../../utils/localStorageUtils';

type MeetingSettingsProps = {
	meetingMediaDefaults: MeetingStorageType;
	setMeetingMediaDefaults: Dispatch<SetStateAction<MeetingStorageType>>;
};

const MeetingSettings: FC<MeetingSettingsProps> = ({
	meetingMediaDefaults,
	setMeetingMediaDefaults
}) => {
	const [t] = useTranslation();
	const meetingSectionLabel = t('settings.meetings.title', 'Meetings');
	const enableMicLabel = t('meeting.interactions.enableMicrophone', 'Enable microphone');
	const enableCamLabel = t('meeting.interactions.enableCamera', 'Enable camera');
	const meetingSectionDescription = t(
		'settings.meetings.description',
		'Set your audio and video preferences to enter the meetings. You can always customize your preferences before joining every meeting.'
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
		<SettingsCard title={meetingSectionLabel} description={meetingSectionDescription}>
			<Container crossAlignment="flex-start" gap="1rem" data-testid="meeting_settings_container">
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
		</SettingsCard>
	);
};

export default MeetingSettings;
