/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useEffect } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import useDarkReader from '../../hooks/useDarkReader';
import ExternalAccessBackground from '../assets/ExternalAccessBackground.png';
import MeetingExternalAccessPage from '../components/meetingAccessPoint/external/MeetingExternalAccessPage';

const BackgroundContainer = styled(Container)`
	background-image: url(${(): string => ExternalAccessBackground});
	background-size: cover;
	aspect-ratio: 1/1;
`;

const MeetingExternalAccessPageView = (): ReactElement => {
	const { darkReaderStatus, enableDarkReader, disableDarkReader } = useDarkReader();

	useEffect(() => {
		if (darkReaderStatus) {
			disableDarkReader();
		}
		return (): void => {
			if (!darkReaderStatus) {
				enableDarkReader();
			}
		};
	}, [darkReaderStatus, disableDarkReader, enableDarkReader]);

	return (
		<BackgroundContainer>
			<MeetingExternalAccessPage />
		</BackgroundContainer>
	);
};

export default MeetingExternalAccessPageView;
