/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import styled from '@emotion/styled';
import { Container, Icon, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useTimer from '../../../hooks/useTimer';
import { getMeetingStartedAt } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';

const CustomContainer = styled(Container)`
	cursor: default;
`;

type MeetingDurationProps = {
	meetingId: string | undefined;
	isPip?: boolean;
};

const MeetingDuration = ({ meetingId, isPip }: MeetingDurationProps): ReactElement | null => {
	const [t] = useTranslation();
	const meetingDurationLabel = t('meeting.durationTooltip', 'Meeting duration');

	const meetingStartedAt = useStore((store) => getMeetingStartedAt(store, meetingId));
	const timer = useTimer(meetingStartedAt);

	if (!meetingId || !meetingStartedAt) return null;
	return (
		<Tooltip label={meetingDurationLabel} placement="top">
			<CustomContainer
				orientation="horizontal"
				width="fit"
				height="fit"
				crossAlignment="flex-end"
				gap="0.25rem"
				data-testid="meeting_duration_component"
			>
				<Icon icon="ClockOutline" color={isPip ? 'gray6' : 'gray0'} size="medium" />
				<Text color={isPip ? 'gray6' : 'gray0'} size="small">
					{timer}
				</Text>
			</CustomContainer>
		</Tooltip>
	);
};
export default MeetingDuration;
