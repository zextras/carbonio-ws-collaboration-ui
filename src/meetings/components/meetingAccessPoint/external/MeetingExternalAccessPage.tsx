/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { Button, Container, Input, Text } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

const CustomContainer = styled(Container)`
	box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.25);
	border-radius: 0.125rem;
`;

const CustomText = styled(Text)`
	font-size: 2.625rem;
`;

const CustomButton = styled(Button)`
	border-radius: 0.125rem;
`;

const MeetingExternalAccessPage = (): ReactElement => {
	const [userName, setUserName] = useState<string>('');

	const handleInputChange = useCallback((ev: React.FormEvent<HTMLInputElement>): void => {
		setUserName(ev.currentTarget.value);
	}, []);

	const isButtonDisabled = useMemo(() => userName.length === 0, [userName.length]);

	// TODO here replace the console log with the implementation of the external user's creation
	const handleCreateExternalUser = useCallback(() => {
		console.log('Creo utente che si chiama ', userName);
	}, [userName]);

	return (
		<Container crossAlignment="flex-start" padding="6.25rem" data-testid="external_access_page">
			<CustomContainer
				mainAlignment="flex-start"
				background={'gray6'}
				width="27.25rem"
				height="fit"
				maxHeight="38.75rem"
				padding={{ vertical: '2rem', horizontal: '3rem' }}
			>
				<Container
					mainAlignment="flex-start"
					gap="1.5rem"
					padding={{ vertical: '4rem' }}
					height="fit"
				>
					<CustomText size="large" weight="bold">
						Hey stranger!
					</CustomText>
					<Text size="large">How would you like to introduce yourself?</Text>
					<Input label=" Type here your name" value={userName} onChange={handleInputChange} />
					<CustomButton
						data-testid="join_button"
						width="fill"
						label="join the meeting"
						onClick={handleCreateExternalUser}
						disabled={isButtonDisabled}
					/>
				</Container>
			</CustomContainer>
		</Container>
	);
};

export default MeetingExternalAccessPage;
