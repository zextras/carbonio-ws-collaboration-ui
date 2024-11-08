/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, Text, Row, Padding } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import styled, { DefaultTheme } from 'styled-components';

import InfoSection from './InfoSection';
import ManageMeetingButtons from './ManageMeetingButtons';
import ParticipantsSection from './ParticipantsSection';
import {
	getMeetingActive,
	getMyMeetingParticipation
} from '../../../../../store/selectors/MeetingSelectors';
import {
	getOwnershipOfTheRoom,
	getRoomSelector
} from '../../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../../store/selectors/SessionSelectors';
import useStore from '../../../../../store/Store';

type virtualRoomElementProps = {
	roomId: string;
	modalRef: React.RefObject<HTMLDivElement>;
};

const CustomContainer = styled(Container)`
	border-radius: 1rem;
	user-select: none;
	-webkit-user-select: none;
	${({ meetingIsActive, theme }: { meetingIsActive?: boolean; theme: DefaultTheme }): string =>
		meetingIsActive
			? `box-sizing: border-box; border: 1.5px solid ${theme.palette.success.regular};`
			: 'border: 1px solid #e6e9ed;'};
`;

const CustomRow = styled(Row)<{ isMyRoom: boolean | undefined }>`
	${({
		isMyRoom
	}: {
		isMyRoom: boolean | undefined;
		theme: DefaultTheme;
	}): string | undefined | false => !isMyRoom && 'opacity: 0.5; cursor: default;'};
`;

const MeetingActive = styled.div`
	width: 0.75rem;
	height: 0.75rem;
	background-color: ${({
		meetingIsActive,
		theme
	}: {
		meetingIsActive?: boolean;
		theme: DefaultTheme;
	}): string => (meetingIsActive ? theme.palette.success.regular : theme.palette.gray2.regular)};
	border-radius: 50%;
`;

const VirtualRoomCard: FC<virtualRoomElementProps> = ({ roomId, modalRef }) => {
	const room = useStore((state) => getRoomSelector(state, roomId));
	const meetingIsActive: boolean = useStore((store) => getMeetingActive(store, roomId));
	const amIParticipating = useStore((state) => getMyMeetingParticipation(state, roomId));
	const userIsModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId ?? ''));
	const sessionId = useStore(getUserId);

	const userIsMember = useMemo(
		() => find(room.members, (member) => member.userId === sessionId),
		[room.members, sessionId]
	);

	const isMyRoom = useMemo(() => userIsMember && userIsModerator, [userIsMember, userIsModerator]);

	return (
		<CustomContainer padding="1rem" meetingIsActive={meetingIsActive}>
			<Container orientation="horizontal">
				<InfoSection
					roomId={roomId}
					userIsModerator={userIsModerator}
					sessionId={sessionId}
					amIParticipating={amIParticipating}
					isMyRoom={isMyRoom}
				/>
				<ManageMeetingButtons
					roomId={roomId}
					sessionId={sessionId}
					amIParticipating={amIParticipating}
					isMyRoom={isMyRoom}
					modalRef={modalRef}
					meetingIsActive={meetingIsActive}
				/>
			</Container>
			<Padding bottom="0.5rem" />
			<Container gap="0.5rem">
				<Container orientation="horizontal" gap="0.5rem">
					<CustomRow width="fit" height="fit" isMyRoom={isMyRoom || amIParticipating}>
						<MeetingActive meetingIsActive={meetingIsActive} />
					</CustomRow>
					<CustomRow
						takeAvailableSpace
						mainAlignment="flex-start"
						isMyRoom={isMyRoom || amIParticipating}
					>
						<Text size="large">{room.name}</Text>
					</CustomRow>
				</Container>
				<ParticipantsSection
					roomId={roomId}
					meetingIsActive={meetingIsActive}
					amIParticipating={amIParticipating}
					isMyRoom={isMyRoom}
				/>
			</Container>
		</CustomContainer>
	);
};

export default VirtualRoomCard;
