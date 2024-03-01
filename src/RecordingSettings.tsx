/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

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

const CustomButton = styled(Button)`
	border-radius: 0.125rem;
`;

const RecordingSettings = (): ReactElement => {
	const t = 0;
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
						defaultChecked
						value
						onClick={(): void => {
							console.log('TODO');
						}}
						label="Enable microphone"
						data-testid="checkbox"
					/>
					<Checkbox
						defaultChecked
						value
						onClick={(): void => {
							console.log('TODO');
						}}
						label="Enable camera"
						data-testid="checkbox"
					/>
				</Container>
				<Divider color="gray2" />
				<Container crossAlignment="flex-start" gap="1rem">
					<Text weight="bold">Recording</Text>
					<Container orientation="horizontal" width="100%" height="fit" mainAlignment="flex-start">
						<Container width="15.625rem">
							<Input backgroundColor={'gray5'} value={t} disabled label="label" />
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

export default RecordingSettings;
