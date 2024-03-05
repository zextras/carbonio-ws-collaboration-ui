/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, SetStateAction, useCallback } from 'react';

import { Checkbox, Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';

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
			data-testid="notification_container"
		>
			<Container crossAlignment="flex-start" gap="1rem">
				<Padding top="large">
					<Text weight="bold">Meetings</Text>
				</Padding>
				<Divider color="gray2" />
				<Container mainAlignment="flex-start" crossAlignment="flex-start" gap="1rem">
					<Text overflow="break-word" size={'small'}>
						Set your audio and video preferences to enter the meetings. You can always customize
						your preferences before joining every meeting.
					</Text>
					<Checkbox
						defaultChecked={meetingMediaDefaults.EnableMicrophone}
						value={meetingMediaDefaults.EnableMicrophone}
						onClick={setMicrophoneEnabled}
						label="Enable microphone"
						data-testid="checkbox"
					/>
					<Checkbox
						defaultChecked={meetingMediaDefaults.EnableCamera}
						value={meetingMediaDefaults.EnableCamera}
						onClick={setCameraEnabled}
						label="Enable camera"
						data-testid="checkbox"
					/>
				</Container>
				{canRecordVideo && (
					<>
						<Divider color="gray2" />
						<RecordingSettings
							recordingDefaults={recordingDefaults}
							setRecordingDefaults={setRecordingDefaults}
						/>
					</>
				)}
			</Container>
		</Container>
	);
};

export default MeetingSettings;
