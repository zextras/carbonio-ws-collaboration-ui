/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import { Avatar, Container, Row, Text } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import useAvatarUtilities from '../../../../../hooks/useAvatarUtilities';
import { getMeetingParticipantsByRoomId } from '../../../../../store/selectors/MeetingSelectors';
import { getUserName } from '../../../../../store/selectors/UsersSelectors';
import useStore from '../../../../../store/Store';
import UserPopoverList from '../../../userPopoverList/UserPopoverList';

type ParticipantsSectionProp = {
	roomId: string;
	meetingIsActive: boolean;
	amIParticipating: boolean;
	isMyRoom: boolean | undefined;
};

const CustomRow = styled(Row)<{ $isMyRoom: boolean | undefined }>`
	${({ $isMyRoom }): string | undefined | false => !$isMyRoom && 'opacity: 0.5; cursor: default;'};
`;

const AvatarCounter = styled.div`
	position: relative;
	width: 2.063rem;
	height: 2.063rem;
	border: 0.063rem solid #ffffff;
	background-color: ${({ theme }): string => theme.palette.gray2.regular};
	border-radius: 50%;
	text-align: center;
	align-content: center;
	font-size: 0.75rem;
	font-weight: 400;
	color: #ffffff;
`;

const AvatarContainer = styled(Container)`
	position: relative;
	cursor: pointer;
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
	const participantsRef = useRef(null);

	const [t] = useTranslation();

	const userOnlyParticipantLabel = t(
		'meeting.virtual.participants.onlyUser',
		'You are the only active participant.'
	);
	const oneActiveParticipantLabel = t(
		'meeting.virtual.participants.singleActive',
		'One active participant.'
	);
	const startMeetingLabel = t(
		'meeting.virtual.startPrompt',
		'Start a meeting in this Virtual Room.'
	);
	const activeParticipantsLabel = t('meeting.virtual.participants.widget', 'Active participants:');

	const meetingParticipants = useStore((store) => getMeetingParticipantsByRoomId(store, roomId));

	const firstParticipantId = useMemo(() => {
		if (meetingParticipants && Object.keys(meetingParticipants).length > 0) {
			return Object.keys(meetingParticipants)[0];
		}
		return '';
	}, [meetingParticipants]);

	const participantName = useStore((store) => getUserName(store, firstParticipantId));

	const userAndOtherParticipantsLabel = t(
		'meeting.virtual.participants.userWithOthers',
		'You and other {{numberOfParticipants}} active participants.',
		{
			numberOfParticipants: size(meetingParticipants) - 1
		}
	);

	const otherParticipantsLabel = t(
		'meeting.virtual.participants.multipleActive',
		'{{numberOfParticipants}} active participants.',
		{
			numberOfParticipants: size(meetingParticipants)
		}
	);

	const { avatarColor, avatarPicture } = useAvatarUtilities(firstParticipantId);

	const participantsLabel = useMemo(() => {
		if (!meetingIsActive) {
			return startMeetingLabel;
		}

		if (amIParticipating) {
			if (size(meetingParticipants) === 1) {
				return userOnlyParticipantLabel;
			}
			return userAndOtherParticipantsLabel;
		}

		if (size(meetingParticipants) === 1) {
			return oneActiveParticipantLabel;
		}

		return otherParticipantsLabel;
	}, [
		amIParticipating,
		meetingIsActive,
		meetingParticipants,
		oneActiveParticipantLabel,
		otherParticipantsLabel,
		startMeetingLabel,
		userAndOtherParticipantsLabel,
		userOnlyParticipantLabel
	]);

	const participantIds = useMemo(
		() => map(meetingParticipants, (participant) => participant.userId),
		[meetingParticipants]
	);

	const avatarList = useMemo(
		() =>
			meetingParticipants &&
			size(meetingParticipants) > 0 && (
				<AvatarContainer orientation="horizontal">
					<CustomParticipantAvatar
						label={participantName}
						shape="round"
						background={avatarColor}
						picture={avatarPicture}
					/>
					{size(meetingParticipants) > 1 && (
						<AvatarCounter>+{size(meetingParticipants) - 1}</AvatarCounter>
					)}
				</AvatarContainer>
			),
		[avatarColor, avatarPicture, meetingParticipants, participantName]
	);

	return (
		<Container orientation="horizontal">
			<CustomRow
				takeAvailableSpace
				mainAlignment="flex-start"
				$isMyRoom={isMyRoom || amIParticipating}
			>
				<Text size="small" weight="light" color="gray1">
					{participantsLabel}
				</Text>
			</CustomRow>
			<CustomRow $isMyRoom={isMyRoom || amIParticipating} ref={participantsRef}>
				{avatarList}
			</CustomRow>
			{size(meetingParticipants) > 0 && isMyRoom && (
				<UserPopoverList
					anchorEl={participantsRef}
					userList={participantIds}
					title={activeParticipantsLabel}
					icon="VideoOutline"
					placement="right"
				/>
			)}
		</Container>
	);
};

export default ParticipantsSection;
