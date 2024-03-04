/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, SetStateAction, useCallback } from 'react';

import {
	Button,
	Checkbox,
	Container,
	Divider,
	Input,
	Padding,
	Text
} from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import { MeetingStorageType } from './types/generics';

const CustomButton = styled(Button)`
	border-radius: 0.125rem;
`;

type MeetingSettingsProps = {
	meetingMediaDefaults: MeetingStorageType;
	setMeetingMediaDefaults: Dispatch<SetStateAction<MeetingStorageType>>;
};

const MeetingSettings: FC<MeetingSettingsProps> = ({
	meetingMediaDefaults,
	setMeetingMediaDefaults
}) => {
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
				<Divider color="gray2" />
				<Container crossAlignment="flex-start" gap="1rem">
					<Text weight="bold">Recording</Text>
					<Container orientation="horizontal" width="100%" height="fit" mainAlignment="flex-start">
						<Container width="15.625rem">
							<Input backgroundColor={'gray5'} value={'0'} disabled label="label" />
						</Container>
						<Padding left="medium" />
						<CustomButton
							width="fit"
							label="browse"
							color="primary"
							type="outlined"
							onClick={(): void => {
								console.log('TODO');
							}}
						/>
						<Padding left="medium" />
						<CustomButton
							width="fit"
							label="reset"
							color="secondary"
							type="outlined"
							onClick={(): void => {
								console.log('TODO');
							}}
						/>
					</Container>
					<Text size="small" overflow="break-word">
						Set a custom folder where to save the recordings of the meetings you stop.
					</Text>
				</Container>
			</Container>
		</Container>
	);
};

export default MeetingSettings;
