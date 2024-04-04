/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Icon, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getMeetingStartedAt } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';

type MeetingDurationProps = {
	meetingId: string | undefined;
};

const MeetingDuration = ({ meetingId }: MeetingDurationProps): ReactElement | null => {
	const [t] = useTranslation();
	const meetingDurationLabel = t('', 'Meeting duration');

	const meetingStartedAt = useStore((store) => getMeetingStartedAt(store, meetingId));

	if (!meetingId || !meetingStartedAt) return null;
	return (
		<Tooltip label={meetingDurationLabel} placement="top">
			<Container orientation="horizontal" width="fit" crossAlignment="flex-end" gap="0.25rem">
				<Icon icon="ClockOutline" color="gray0" size="medium" />
				<Text color="gray0" size="small">
					{meetingStartedAt}
				</Text>
			</Container>
		</Tooltip>
	);
};
export default MeetingDuration;
