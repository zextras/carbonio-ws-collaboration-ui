/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Container, Text, Row, Tooltip } from '@zextras/carbonio-design-system';

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
import useStore from '../../../../../store/Store';

type virtualRoomElementProps = {
	roomId: string;
	modalRef: React.RefObject<HTMLDivElement>;
};

const CustomContainer = styled(Container)<{ $meetingIsActive?: boolean }>`
	border-radius: 1rem;
	user-select: none;
	-webkit-user-select: none;
	${({ $meetingIsActive, theme }): string =>
		$meetingIsActive
			? `box-sizing: border-box; border: 1.5px solid ${theme.palette.success.regular};`
			: 'border: 1px solid #e6e9ed;'};
`;

const CustomRow = styled(Row)<{ $isMyRoom: boolean | undefined }>`
	${({ $isMyRoom }): string | undefined | false => !$isMyRoom && 'opacity: 0.5; cursor: default;'};
`;

const MeetingActive = styled.div<{ $meetingIsActive?: boolean }>`
	width: 0.75rem;
	height: 0.75rem;
	background-color: ${({ $meetingIsActive, theme }): string =>
		$meetingIsActive ? theme.palette.success.regular : theme.palette.gray2.regular};
	border-radius: 50%;
`;

const VirtualRoomCard: FC<virtualRoomElementProps> = ({ roomId, modalRef }) => {
	const room = useStore((state) => getRoomSelector(state, roomId));
	const meetingIsActive = useStore((store) => getMeetingActive(store, roomId));
	const amIParticipating = useStore((state) => getMyMeetingParticipation(state, roomId));
	const userIsModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId ?? ''));

	return (
		<CustomContainer padding="1rem" gap="0.5rem" $meetingIsActive={meetingIsActive}>
			<Container orientation="horizontal">
				<InfoSection
					roomId={roomId}
					userIsModerator={userIsModerator}
					amIParticipating={amIParticipating}
					isMyRoom={userIsModerator}
				/>
				<ManageMeetingButtons
					roomId={roomId}
					amIParticipating={amIParticipating}
					isMyRoom={userIsModerator}
					modalRef={modalRef}
					meetingIsActive={meetingIsActive}
				/>
			</Container>
			<Container gap="0.5rem">
				<Container orientation="horizontal" gap="0.5rem">
					<CustomRow width="fit" height="fit" $isMyRoom={userIsModerator || amIParticipating}>
						<MeetingActive $meetingIsActive={meetingIsActive} />
					</CustomRow>
					<CustomRow
						takeAvailableSpace
						mainAlignment="flex-start"
						$isMyRoom={userIsModerator || amIParticipating}
					>
						<Tooltip label={room.name} overflowTooltip>
							<Text size="large">{room.name}</Text>
						</Tooltip>
					</CustomRow>
				</Container>
				<ParticipantsSection
					roomId={roomId}
					meetingIsActive={meetingIsActive}
					amIParticipating={amIParticipating}
					isMyRoom={userIsModerator}
				/>
			</Container>
		</CustomContainer>
	);
};

export default VirtualRoomCard;
