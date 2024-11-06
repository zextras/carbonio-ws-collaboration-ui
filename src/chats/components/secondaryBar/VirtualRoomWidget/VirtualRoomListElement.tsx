/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Container,
	CreateSnackbarFn,
	useSnackbar,
	Text,
	Modal,
	Button,
	Row,
	Shimmer,
	Avatar,
	Tooltip,
	Padding
} from '@zextras/carbonio-design-system';
import { find, map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components';

import useAvatarUtilities from '../../../../hooks/useAvatarUtilities';
import useRoomMeeting from '../../../../hooks/useRoomMeeting';
import { RoomsApi } from '../../../../network';
import {
	getMeetingActive,
	getMeetingParticipants,
	getMyMeetingParticipation
} from '../../../../store/selectors/MeetingSelectors';
import {
	getOwners,
	getOwnershipOfTheRoom,
	getRoomSelector
} from '../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import { getUserName, getUserNames } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';

type virtualRoomElementProps = {
	roomId: string;
	modalRef: React.RefObject<HTMLDivElement>;
};

const opacityOptions = 'opacity: 0.5; cursor: default;';

const CustomContainer = styled(Container)`
	border-radius: 1rem;
	border: 1px solid #e6e9ed;
	user-select: none;
	-webkit-user-select: none;
`;

const CustomRow = styled(Row)<{ isMyRoom: boolean | undefined }>`
	${({
		isMyRoom
	}: {
		isMyRoom: boolean | undefined;
		theme: DefaultTheme;
	}): string | undefined | false => !isMyRoom && opacityOptions};
`;

const CustomAvatar = styled(Avatar)`
	min-width: 2rem;
	min-height: 2rem;
`;

const CustomParticipantAvatar = styled(Avatar)`
	position: absolute;
	left: -24px;
	min-width: 2rem;
	min-height: 2rem;
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

const CustomDeleteButton = styled(Button)<{ isMyRoom: boolean | undefined }>`
	${({
		isMyRoom
	}: {
		isMyRoom: boolean | undefined;
		theme: DefaultTheme;
	}): string | undefined | false => !isMyRoom && opacityOptions};
	&:hover {
		background-color: ${({ theme }): string => theme.palette.error.regular};
		color: ${({ theme }): string => theme.palette.gray6.regular};
	}
`;

const CustomMainButton = styled(Button)<{ isMyRoom: boolean | undefined }>`
	${({
		isMyRoom
	}: {
		isMyRoom: boolean | undefined;
		theme: DefaultTheme;
	}): string | undefined | false => !isMyRoom && 'opacity: 1;'};
`;

const AvatarContainer = styled(Container)`
	position: relative;
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

const VirtualRoomListElement: FC<virtualRoomElementProps> = ({ roomId, modalRef }) => {
	const [t] = useTranslation();

	const deleteVirtualRoomTooltip = t('meeting.virtual.deleteTooltip', 'Delete Virtual Room');
	const copyVirtualRoomTooltip = t('meeting.virtual.copyTooltip', "Copy Virtual Room's link");
	const startMeeting = t('meeting.startMeeting', 'Start meeting');
	const joinMeeting = t('meeting.joinMeeting', 'Join meeting');
	const rejoinMeeting = t('meeting.rejoinMeeting', 'Rejoin meeting');
	const closeLabel = t('action.close', 'Close');
	const deleteVirtualRoomLabel = t('action.delete', 'Delete');
	const leaveRoomTooltip = t('modal.leaveRoom', 'Leave Room');
	const copyVirtualRoomLinkSnackbar = t(
		'meeting.virtual.copyLinkSnackbar',
		"Virtual Room's link copied"
	);
	const deleteVirtualRoomSnackbar = t(
		'meeting.virtual.deleteSnackbar',
		'Virtual Room deleted successfully'
	);
	const deleteVirtualRoomDescription = t(
		'meeting.virtual.deleteModalDescription',
		'You are deleting this Virtual Room, if it has active meetings, it will be interrupted and no one will be able to access it anymore. Proceed?'
	);
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);

	const room = useStore((state) => getRoomSelector(state, roomId));
	const meetingIsActive: boolean = useStore((store) => getMeetingActive(store, roomId));
	const amIParticipating = useStore((state) => getMyMeetingParticipation(state, roomId));
	const userIsModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId ?? ''));
	const meetingParticipants = useStore((store) => getMeetingParticipants(store, roomId));
	const moderatorsList = useStore((store) => getOwners(store, roomId));
	const sessionId = useStore(getUserId);
	const sessionName = useStore((store) => getUserName(store, sessionId ?? ''));
	const moderatorName = useStore((store) => getUserName(store, moderatorsList[0].userId));

	const modalTitle = t('meeting.virtual.deleteModalTitle', `Delete ${room.name} Virtual Room`, {
		roomName: room.name
	});

	const [showModal, setShowModal] = useState(false);
	const createSnackbar: CreateSnackbarFn = useSnackbar();
	const { openMeeting, copyMeetingLink } = useRoomMeeting(roomId);

	const handleDeleteRoom = useCallback(() => {
		RoomsApi.deleteRoomAndMeeting(roomId)
			.then(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'success',
					label: deleteVirtualRoomSnackbar,
					hideButton: true
				});
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					label: errorSnackbar,
					hideButton: true
				});
			});
	}, [createSnackbar, deleteVirtualRoomSnackbar, errorSnackbar, roomId]);

	const handleCopyLink = useCallback(() => {
		copyMeetingLink();
		createSnackbar({
			key: new Date().toLocaleString(),
			severity: 'info',
			label: copyVirtualRoomLinkSnackbar,
			hideButton: true
		});
	}, [copyMeetingLink, createSnackbar, copyVirtualRoomLinkSnackbar]);

	const enterMeeting = useMemo(
		() => (amIParticipating ? rejoinMeeting : joinMeeting),
		[amIParticipating, joinMeeting, rejoinMeeting]
	);

	const enterRoomTooltip = useMemo(
		() => (meetingIsActive ? enterMeeting : startMeeting),
		[enterMeeting, meetingIsActive, startMeeting]
	);

	const handleModalOpening = useCallback(() => setShowModal((prevState) => !prevState), []);

	const ownerName = useMemo(
		() => (userIsModerator ? 'You' : moderatorName),
		[userIsModerator, moderatorName]
	);

	const moderatorLabel = useMemo(() => {
		if (moderatorsList.length === 1) {
			if (userIsModerator) {
				return "You're the only moderator";
			}
			return 'is the only moderator';
		}
		if (moderatorsList.length === 2) {
			return 'and other one moderator';
		}
		return `and other ${moderatorsList.length - 1} moderators`;
	}, [userIsModerator, moderatorsList.length]);

	const { avatarColor, isLoading } = useAvatarUtilities(
		userIsModerator ? (sessionId ?? '') : moderatorsList[0].userId
	);

	const userIsMember = useMemo(
		() => find(room.members, (member) => member.userId === sessionId),
		[room.members, sessionId]
	);

	const isMyRoom = useMemo(() => userIsMember && userIsModerator, [userIsMember, userIsModerator]);

	const firstParticipantId = useMemo(() => {
		if (meetingParticipants && Object.keys(meetingParticipants).length > 0) {
			return Object.keys(meetingParticipants)[0];
		}
		return '';
	}, [meetingParticipants]);

	const { avatarColor: participantColor } = useAvatarUtilities(firstParticipantId);

	const participantName = useStore((store) => getUserName(store, firstParticipantId));

	const participantsLabel = useMemo(() => {
		if (meetingIsActive) {
			if (amIParticipating) {
				return `You and other ${size(meetingParticipants) - 1} active participants.`;
			}
			if (size(meetingParticipants) === 1) {
				return `${size(meetingParticipants)} active participant.`;
			}
			return `${size(meetingParticipants)} active participants.`;
		}
		return 'Start a meeting in this virtual room.';
	}, [amIParticipating, meetingIsActive, meetingParticipants]);

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

	const leaveConversation = useCallback(() => {
		if (sessionId) {
			RoomsApi.deleteRoomMember(roomId, sessionId).then(() => {});
		}
	}, [roomId, sessionId]);

	const participantIds = useMemo(
		() => map(meetingParticipants, (participant) => participant.userId),
		[meetingParticipants]
	);

	const userNames = useStore((store) => getUserNames(store, participantIds));

	return (
		<CustomContainer padding="1rem">
			<Container orientation="horizontal">
				<CustomRow
					takeAvailableSpace
					orientation="horizontal"
					gap="0.5rem"
					mainAlignment="flex-start"
					isMyRoom={amIParticipating || isMyRoom}
				>
					{isLoading ? (
						<Shimmer.Avatar />
					) : (
						<CustomAvatar
							label={userIsModerator ? sessionName : moderatorName}
							shape="round"
							background={avatarColor}
						/>
					)}
					<Container height="fit" width="fit" crossAlignment="flex-start">
						<Text size="small" overflow="ellipsis">
							{ownerName}
						</Text>
						<Text size="extrasmall" weight="light" color="gray1">
							{moderatorLabel}
						</Text>
					</Container>
				</CustomRow>
				<Row orientation="horizontal" gap="0.25rem">
					{isMyRoom && (
						<Tooltip label={deleteVirtualRoomTooltip}>
							<CustomDeleteButton
								type="ghost"
								color="text"
								icon="Trash2Outline"
								onClick={handleModalOpening}
								isMyRoom={amIParticipating || isMyRoom}
							/>
						</Tooltip>
					)}
					<Tooltip label={copyVirtualRoomTooltip} disabled={!(amIParticipating || isMyRoom)}>
						<Button
							type="ghost"
							color="text"
							icon="Link2Outline"
							onClick={handleCopyLink}
							disabled={!(amIParticipating || isMyRoom)}
						/>
					</Tooltip>
					<Tooltip label={amIParticipating || isMyRoom ? enterRoomTooltip : leaveRoomTooltip}>
						<CustomMainButton
							color={amIParticipating || isMyRoom ? 'primary' : 'error'}
							icon={amIParticipating || isMyRoom ? 'Video' : 'LogOut'}
							onClick={amIParticipating || isMyRoom ? openMeeting : leaveConversation}
							isMyRoom={amIParticipating || isMyRoom}
						/>
					</Tooltip>
				</Row>
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
						<Text>{room.name}</Text>
					</CustomRow>
				</Container>
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
			</Container>
			<Modal
				title={modalTitle}
				open={showModal}
				onConfirm={handleDeleteRoom}
				confirmLabel={deleteVirtualRoomLabel}
				onClose={handleModalOpening}
				showCloseIcon
				ref={modalRef}
				confirmColor="error"
				closeIconTooltip={closeLabel}
			>
				<Text overflow="break-word">{deleteVirtualRoomDescription}</Text>
			</Modal>
		</CustomContainer>
	);
};

export default VirtualRoomListElement;
