/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const MyStreamContainer = styled(Container)`
	position: relative;
`;

const GridMode = (): ReactElement => {
	const [t] = useTranslation();
	const waitingParticipants = t(
		'meeting.waitingParticipants',
		'Waiting for participants to join...'
	);

	return (
		<>
			<Container data-testid="gridModeView" height="fit" crossAlignment="flex-end">
				<MyStreamContainer height="153px" width="256px" background="secondary" />
			</Container>
			<Container>
				<Text color="gray6" size="large">
					{waitingParticipants}
				</Text>
			</Container>
		</>
	);
};

export default GridMode;
