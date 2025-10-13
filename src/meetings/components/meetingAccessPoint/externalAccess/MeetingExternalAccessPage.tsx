/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MEETINGS_PATH } from '../../../../constants/appConstants';
import useRouting from '../../../../hooks/useRouting';
import { MeetingsApi } from '../../../../network';
import { PAGE_INFO_TYPE } from '../../../contexts/routerContext';
import Logo from '../../Logo';

const MeetingExternalAccessPage = (): ReactElement => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const [meetingName, setMeetingName] = useState<string>('');

	const { goToInfoPage } = useRouting();

	useEffect(() => {
		MeetingsApi.getScheduledMeetingName(meetingId)
			.then((resp) => {
				setMeetingName(resp.name);
			})
			.catch(() => {
				goToInfoPage(PAGE_INFO_TYPE.MEETING_NOT_FOUND);
			});
	}, [goToInfoPage, meetingId]);

	const [t] = useTranslation();
	// TODO: translation keys
	const titleLabel = t('', 'Welcome to {{title}} virtual room', { title: meetingName });

	return (
		<Container background={'gray0'} height="fill" width="fill" style={{ position: 'relative' }}>
			<Logo />
			<Container width="fit" height="fit" gap="1rem">
				<Container
					background={'gray6'}
					padding="large"
					width="fill"
					style={{ borderRadius: '1rem' }}
				>
					<Text size="extralarge" weight="bold">
						{titleLabel}
					</Text>
				</Container>
				<Container orientation="horizontal" gap="1rem">
					<Container
						background={'gray6'}
						width="fit"
						padding="extralarge"
						style={{ borderRadius: '1rem' }}
					>
						video e controlli
					</Container>
					<Container
						background={'gray6'}
						width="fit"
						padding="extralarge"
						style={{ borderRadius: '1rem' }}
					>
						nome e join
					</Container>
				</Container>
			</Container>
		</Container>
	);
};

export default MeetingExternalAccessPage;
