/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Container, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { calcScaleDivisor } from '../../utils/styleUtils';
import MeetingAccessPageMediaSection from '../components/meetingAccessPoint/MeetingAccessPageMediaSection';
import useAccessMeetingAction from '../components/meetingAccessPoint/useAccessMeetingAction';
import useAccessMeetingInformation from '../components/meetingAccessPoint/useAccessMeetingInformation';

const CustomContainer = styled(Container)`
	position: absolute;
	left: 4rem;
	bottom: 3rem;
`;

const MeetingAccessPage = (): ReactElement => {
	const [t] = useTranslation();
	const leave = t('action.leave', 'Leave');
	const leaveMeetingLabel = t('meeting.interactions.leaveMeeting', 'Leave Meeting');

	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [pageWidth, setPageWidth] = useState(window.innerWidth);
	const [wrapperWidth, setWrapperWidth] = useState<number>((window.innerWidth * 0.33) / 16);

	const {
		hasUserDirectAccess,
		meetingName,
		ShowMeetingAccessPage,
		accessTitle,
		userIsReady,
		setUserIsReady
	} = useAccessMeetingInformation();

	const { handleLeave, handleEnterMeeting, handleWaitingRoom } = useAccessMeetingAction(
		hasUserDirectAccess,
		streamTrack,
		userIsReady,
		setUserIsReady
	);

	// resize handling
	const handleResize = useCallback(() => {
		setPageWidth(window.innerWidth);
		setWrapperWidth((window.innerWidth * 0.33) / calcScaleDivisor());
	}, []);

	useEffect(() => {
		window.addEventListener('resize', handleResize);

		return (): void => window.removeEventListener('resize', handleResize);
	}, [handleResize]);

	useEffect(() => {
		setPageWidth(window.innerWidth);
		setWrapperWidth((window.innerWidth * 0.33) / calcScaleDivisor());
	}, []);

	const leaveButton = useMemo(() => {
		if (hasUserDirectAccess === undefined) {
			return undefined;
		}
		return (
			!hasUserDirectAccess && (
				<CustomContainer
					height="fit"
					width="fit"
					mainAlignment="flex-end"
					crossAlignment="flex-start"
				>
					{pageWidth >= 1024 ? (
						<Button
							backgroundColor="error"
							label={leave}
							icon="LogOut"
							iconPlacement="right"
							onClick={handleLeave}
						/>
					) : (
						<Tooltip label={leaveMeetingLabel}>
							<Button size="large" backgroundColor="error" icon="LogOut" onClick={handleLeave} />
						</Tooltip>
					)}
				</CustomContainer>
			)
		);
	}, [handleLeave, hasUserDirectAccess, leave, leaveMeetingLabel, pageWidth]);

	return (
		<ShowMeetingAccessPage>
			<Container>
				<Container mainAlignment="center" crossAlignment="center" gap="1.5rem">
					<Container height="fit" width="fit">
						<Text size="extralarge" weight="bold">
							{accessTitle}
						</Text>
					</Container>
					<MeetingAccessPageMediaSection
						streamTrack={streamTrack}
						setStreamTrack={setStreamTrack}
						hasUserDirectAccess={hasUserDirectAccess}
						userIsReady={userIsReady}
						setUserIsReady={setUserIsReady}
						meetingName={meetingName}
						wrapperWidth={wrapperWidth}
						handleEnterMeeting={handleEnterMeeting}
						handleWaitingRoom={handleWaitingRoom}
					/>
				</Container>
				{leaveButton}
			</Container>
		</ShowMeetingAccessPage>
	);
};

export default MeetingAccessPage;
