/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Container, Divider, Input, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MEETINGS_PATH } from '../../../../constants/appConstants';
import useRouting from '../../../../hooks/useRouting';
import { MeetingsApi } from '../../../../network';
import { PAGE_INFO_TYPE } from '../../../contexts/routerContext';
import Logo from '../../Logo';

const MeetingExternalAccessPage = (): ReactElement => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const [meetingName, setMeetingName] = useState<string>('');
	const [guestName, setGuestName] = useState<string>('');

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
	const titleLabel = t('', 'Welcome to "{{title}}" virtual room', { title: meetingName });
	const subtitleLabel = t('', 'Join as guest');
	const descriptionLabel = t('', 'Enter your name to join this meeting');
	const inputLabel = t('', 'Enter your name');
	const buttonLabel = t('', 'Ready to participate');
	const alreadyHaveAccountLabel = t('', 'Already have an account? Access with your credentials.');
	const loginPageButtonLabel = t('', 'Go to your login page');

	const readyToParticipateDisabled = useMemo(() => guestName.trim().length === 0, [guestName]);

	const readyToParticipate = useCallback(() => {
		// TODO: implement ready to participate action
	}, []);

	const goToLoginPage = useCallback(() => {
		const meetingUrl = window.location.href;
		const domainUrl = /^(.*)\/carbonio/.exec(meetingUrl);
		if (domainUrl) {
			const urlUpdated = meetingUrl.replaceAll(/:/g, '%3A').replaceAll('/', '%2F');
			const loginUrl = `${domainUrl[1]}/static/login/?destinationUrl=${urlUpdated}`;
			window.location.replace(loginUrl);
		}
	}, []);

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
						gap="1rem"
						style={{ borderRadius: '1rem' }}
					>
						<Text size="extralarge" weight="bold">
							{subtitleLabel}
						</Text>
						<Text>{descriptionLabel}</Text>
						<Input
							label={inputLabel}
							onChange={(ev) => setGuestName(ev.target.value)}
							value={guestName}
						/>
						<Button
							width="fill"
							label={buttonLabel}
							color="success"
							onClick={readyToParticipate}
							disabled={readyToParticipateDisabled}
						/>
						<Container padding="medium" width="fill" height="fit">
							<Divider />
						</Container>
						<Text size="small">{alreadyHaveAccountLabel}</Text>
						<Button
							width="fill"
							label={loginPageButtonLabel}
							onClick={goToLoginPage}
							type="outlined"
						/>
					</Container>
				</Container>
			</Container>
		</Container>
	);
};

export default MeetingExternalAccessPage;
