/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { ReactElement, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { getMeetingParticipantsByMeetingId } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import TestTile from '../TestTile';

const Wrapper = styled(Container)`
	position: relative;
`;
const GridMode = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();
	const participants = useStore((store) => getMeetingParticipantsByMeetingId(store, meetingId));

	const videos = useMemo(
		() =>
			map(participants, (participant) => (
				<TestTile key={participant.userId} meetingId={meetingId} userId={participant.userId} />
			)),
		[meetingId, participants]
	);

	return (
		<Wrapper data-testid="gridModeView" orientation="vertical">
			{videos}
		</Wrapper>
	);
};

export default GridMode;
