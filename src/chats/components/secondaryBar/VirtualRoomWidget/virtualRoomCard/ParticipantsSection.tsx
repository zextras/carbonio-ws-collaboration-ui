/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { Avatar, Container, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import styled, { DefaultTheme } from 'styled-components';

import useAvatarUtilities from '../../../../../hooks/useAvatarUtilities';
import { getMeetingParticipants } from '../../../../../store/selectors/MeetingSelectors';
import { getUserName, getUserNames } from '../../../../../store/selectors/UsersSelectors';
import useStore from '../../../../../store/Store';

type ParticipantsSectionProp = {
	roomId: string;
	meetingIsActive: boolean;
	amIParticipating: boolean;
	isMyRoom: boolean | undefined;
};

const CustomRow = styled(Row)<{ isMyRoom: boolean | undefined }>`
	${({
		isMyRoom
	}: {
		isMyRoom: boolean | undefined;
		theme: DefaultTheme;
	}): string | undefined | false => !isMyRoom && 'opacity: 0.5; cursor: default;'};
`;

const AvatarCounter = styled.div`
	position: relative;
	width: 2.063rem;
	height: 2.063rem;
	border: 0.063rem solid #ffffff;
	background-color: ${({ theme }: { theme: DefaultTheme }): string => theme.palette.gray2.regular};
	border-radius: 50%;
	text-align: center;
	align-content: center;
	font-size: 0.75rem;
	font-weight: 400;
	color: #ffffff;
`;

const AvatarContainer = styled(Container)`
	position: relative;
`;

const CustomParticipantAvatar = styled(Avatar)`
	position: absolute;
	left: -24px;
	min-width: 2rem;
	min-height: 2rem;
`;

const ParticipantsSection: FC<ParticipantsSectionProp> = ({
	roomId,
	meetingIsActive,
	amIParticipating,
	isMyRoom
}) => {
	const t = 0;

	const meetingParticipants = useStore((store) => getMeetingParticipants(store, roomId));

	const firstParticipantId = useMemo(() => {
		if (meetingParticipants && Object.keys(meetingParticipants).length > 0) {
			return Object.keys(meetingParticipants)[0];
		}
		return '';
	}, [meetingParticipants]);

	const participantName = useStore((store) => getUserName(store, firstParticipantId));

	const { avatarColor: participantColor } = useAvatarUtilities(firstParticipantId);

	const participantsLabel = useMemo(() => {
		if (meetingIsActive) {
			if (amIParticipating) {
				if (size(meetingParticipants) === 1) {
					return ' You are the only active participant.';
				}
				return `You and other ${size(meetingParticipants) - 1} active participants.`;
			}
			if (size(meetingParticipants) === 1) {
				return `${size(meetingParticipants)} active participant.`;
			}
			return `${size(meetingParticipants)} active participants.`;
		}
		return 'Start a meeting in this virtual room.';
	}, [amIParticipating, meetingIsActive, meetingParticipants]);

	const participantIds = useMemo(
		() => map(meetingParticipants, (participant) => participant.userId),
		[meetingParticipants]
	);

	const userNames = useStore((store) => getUserNames(store, participantIds));

	const avatarList = useMemo(
		() =>
			meetingParticipants &&
			size(meetingParticipants) > 0 && (
				<AvatarContainer orientation="horizontal">
					<CustomParticipantAvatar
						label={participantName}
						shape="round"
						background={participantColor}
					/>
					{size(meetingParticipants) > 1 && (
						<AvatarCounter>+{size(meetingParticipants) - 1}</AvatarCounter>
					)}
				</AvatarContainer>
			),
		[meetingParticipants, participantColor, participantName]
	);

	return (
		<Container orientation="horizontal">
			<CustomRow
				takeAvailableSpace
				mainAlignment="flex-start"
				isMyRoom={isMyRoom || amIParticipating}
			>
				<Text size="small" weight="light" color="gray1">
					{participantsLabel}
				</Text>
			</CustomRow>
			<Tooltip label={userNames.join(', ')} disabled={size(meetingParticipants) === 0}>
				<CustomRow isMyRoom={isMyRoom || amIParticipating}>{avatarList}</CustomRow>
			</Tooltip>
		</Container>
	);
};

export default ParticipantsSection;
