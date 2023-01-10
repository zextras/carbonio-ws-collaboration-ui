/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Container,
	FileLoader,
	IconButton,
	Padding,
	SnackbarManagerContext,
	Text,
	Tooltip,
	CreateSnackbarFn
} from '@zextras/carbonio-design-system';
import moment from 'moment-timezone';
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css, DefaultTheme, FlattenInterpolation, ThemeProps } from 'styled-components';

import { RoomsApi, UsersApi } from '../../../network';
import {
	getMyOwnershipOfTheRoom,
	getNumbersOfRoomMembers,
	getPictureUpdatedAt,
	getRoomNameSelector
} from '../../../store/selectors/RoomsSelectors';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import {
	getUserEmail,
	getUserLastActivity,
	getUserName,
	getUserOnline,
	getUserPictureUpdatedAt
} from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';
import { calculateAvatarColor } from '../../../utils/styleUtils';

type CreateSnackbarFn = typeof CreateSnackbarFn;

type RoomPictureProps = {
	roomId: string;
	memberId: string;
	roomType: string;
};

const HoverContainer = styled(Container)`
	opacity: 0;
`;

const BackgroundContainer = styled(Container)`
	border-radius: 0;
	background-color: ${({ color, theme }): string | false => `${theme.avatarColors[color]}`};
	&:hover {
		background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
			${({ color, hasHoverGradient, theme }): string | false =>
				hasHoverGradient && `${theme.avatarColors[color]}`};
		background: -webkit-linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
			${({ color, hasHoverGradient, theme }): string | false =>
				hasHoverGradient && `${theme.avatarColors[color]}`};
		background: -moz-linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
			${({ color, hasHoverGradient, theme }): string | false =>
				hasHoverGradient && `${theme.avatarColors[color]}`};
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const PictureContainer = styled(Container)`
	border-radius: 0;
	background-image: url(${({ picture }): string => picture});
	background-size: cover;
	background-position: center;
	aspect-ratio: 1/1;
	z-index: 2;

	&:after {
		background-color: ${({ theme }): string => `${theme.palette.gray6.regular}`};
		z-index: 1;
	}

	//  TODO: remove hasHover when the preview of the image is implemented
	${({
		hasHover,
		picture
	}: {
		hasHover: boolean;
		picture: string;
	}): false | FlattenInterpolation<ThemeProps<never>> =>
		hasHover &&
		css`
			&:hover {
				background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(${picture});
				background-image: -webkit-linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
					url(${picture});
				background-image: -moz-linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
					url(${picture});
				background-size: cover;
				background-position: center;
				aspect-ratio: 1/1;

				${HoverContainer} {
					opacity: 1;
				}
			}
		`}
`;

const GradientContainer = styled(Container)`
	background: linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 45%);
`;

const CustomText = styled(Text)`
	text-overflow: ellipsis;
	text-shadow: ${({ hasPicture }): string | false =>
		hasPicture && '0.063rem 0.063rem 0.25rem #111'};
`;

const NameWrapText = styled(Text)`
	white-space: unset;
	overflow: unset;
	text-overflow: unset;
	word-break: break-word;
	text-shadow: ${({ hasPicture }): string | false =>
		hasPicture && '0.063rem 0.063rem 0.25rem #111'};
`;

const Presence = styled.div`
	width: 0.6rem;
	height: 0.6rem;
	background-color: ${({ theme }: { theme: DefaultTheme }): string =>
		theme.palette.success.regular};
	border: 0.0625rem solid ${(props): string => props.theme.palette.gray5.regular};
	border-radius: 50%;
	margin-right: 0.1875rem;
`;

const RoomPictureHandler: FC<RoomPictureProps> = ({ memberId, roomType, roomId }) => {
	const maxRoomImageSize = useStore((store) =>
		getCapability(store, CapabilityType.MAX_ROOM_IMAGE_SIZE)
	);
	const canSeeUsersPresence = useStore((store) =>
		getCapability(store, CapabilityType.CAN_SEE_USERS_PRESENCE)
	);
	const [t] = useTranslation();
	const userOnlineLabel: string = t('status.online', 'Online');
	const userOfflineLabel: string = t('status.offline', 'Offline');
	const updatedImageSnackbar = t(
		'settings.room.updatedPictureCorrectly',
		'New avatar has been successfully uploaded'
	);
	const imageSizeTooLargeSnackbar = t(
		'settings.room.pictureSizeTooLarge',
		`Something went wrong, remember that the maximum size for a group’s avatar image is ${maxRoomImageSize}kb`,
		{ size: maxRoomImageSize }
	);
	const uploadPictureLabel = t('tooltip.room.uploadPicture', 'Upload picture');
	const updatePictureLabel = t('tooltip.room.updatePicture', 'Update picture');
	const resetPictureLabel = t('tooltip.room.resetPicture', 'Reset picture');
	const oneParticipantAccordionTitle = t(
		'participantsList.oneParticipantAccordionTitle',
		'One Participant'
	);
	const moreParticipantsAccordionTitle = t(
		'participantsList.moreParticipantsAccordionTitle',
		`Participants`
	);
	const errorDeleteImageSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);
	const deletedImageSnackbar = t(
		'settings.room.deletedImageCorrectly',
		'Group avatar has been successfully reset to the original one'
	);

	const sessionId: string | undefined = useStore((store) => store.session.id);
	const iAmOwner: boolean = useStore((state) => getMyOwnershipOfTheRoom(state, sessionId, roomId));
	const numberOfMembers: number = useStore((state) => getNumbersOfRoomMembers(state, roomId));
	const memberName: string | undefined = useStore((state) => getUserName(state, memberId));
	const memberEmail: string | undefined = useStore((state) => getUserEmail(state, memberId));
	const roomName: string | undefined = useStore((state) => getRoomNameSelector(state, roomId));
	const memberOnline: boolean | undefined = useStore((state) => getUserOnline(state, memberId));
	const roomPictureUpdatedAt: string | undefined = useStore((state) =>
		getPictureUpdatedAt(state, roomId)
	);
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, memberId)
	);
	const memberLastActivity: number | undefined = useStore((state) =>
		getUserLastActivity(state, memberId)
	);
	const setRoomPictureUpdated = useStore((state) => state.setRoomPictureUpdated);
	const setRoomPictureDeleted = useStore((state) => state.setRoomPictureDeleted);

	const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	const [picture, setPicture] = useState<false | string>(false);

	useEffect(() => {
		if (roomType === RoomType.ONE_TO_ONE) {
			if (userPictureUpdatedAt != null) {
				setPicture(`${UsersApi.getURLUserPicture(memberId)}?${userPictureUpdatedAt}`);
			} else {
				setPicture(false);
			}
		}
		if (roomType === RoomType.GROUP) {
			if (roomPictureUpdatedAt != null) {
				setPicture(`${RoomsApi.getURLRoomPicture(roomId)}?${roomPictureUpdatedAt}`);
			} else {
				setPicture(false);
			}
		}
	}, [memberId, roomPictureUpdatedAt, roomId, roomType, userPictureUpdatedAt]);

	const hasHoverGradient = useMemo(
		() => roomType === RoomType.GROUP && iAmOwner,
		[roomType, iAmOwner]
	);

	const numberOfParticipantsLabel = useMemo(() => {
		if (numberOfMembers === 1) {
			return oneParticipantAccordionTitle;
		}
		return `${numberOfMembers} ${moreParticipantsAccordionTitle}`;
	}, [numberOfMembers, oneParticipantAccordionTitle, moreParticipantsAccordionTitle]);

	const lastSeen: string | undefined = useMemo(() => {
		if (memberLastActivity) {
			return moment(memberLastActivity).calendar().toLocaleLowerCase();
		}
		return undefined;
	}, [memberLastActivity]);

	const lastSeenLabel: string = t('status.lastSeen', `Last Seen ${lastSeen}`, { lastSeen });

	const presenceLabel = useMemo(
		() => (memberOnline ? userOnlineLabel : memberLastActivity ? lastSeenLabel : userOfflineLabel),
		[memberOnline, memberLastActivity, userOnlineLabel, lastSeenLabel, userOfflineLabel]
	);

	const userInfo = useMemo(
		() => (
			<Container orientation="horizontal">
				<Container
					crossAlignment="flex-start"
					padding={{ left: 'large', bottom: 'large', right: 'large' }}
					mainAlignment="flex-end"
				>
					<NameWrapText color="gray6" size="medium" hasPicture={!!picture}>
						{memberName || memberEmail}
					</NameWrapText>
					<Padding top="extrasmall" />
					{canSeeUsersPresence && (
						<Container orientation="horizontal" mainAlignment="flex-start" height="fit">
							{memberOnline && <Presence data-testid="user_presence_dot" />}
							{memberOnline && <Padding right={'0.25rem'} />}
							<CustomText size="small" color="gray6" hasPicture={!!picture}>
								{presenceLabel}
							</CustomText>
						</Container>
					)}
				</Container>
			</Container>
		),
		[picture, memberName, memberEmail, canSeeUsersPresence, memberOnline, presenceLabel]
	);

	const roomInfo = useMemo(
		() => (
			<Container
				orientation="vertical"
				crossAlignment="flex-start"
				mainAlignment="flex-end"
				padding={{ left: 'large', bottom: 'large', right: 'large' }}
			>
				<NameWrapText color="gray6" hasPicture={!!picture}>
					{roomName}
				</NameWrapText>
				<Padding top="extrasmall" />
				<CustomText size="small" color="gray6" hasPicture={!!picture}>
					{numberOfParticipantsLabel}
				</CustomText>
			</Container>
		),
		[picture, roomName, numberOfParticipantsLabel]
	);

	const handleGroupPictureChange = useCallback(
		(e) => {
			RoomsApi.updateRoomPicture(roomId, e.target.files[0])
				.then(() => {
					setRoomPictureUpdated(roomId, new Date().toISOString());
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'info',
						label: updatedImageSnackbar,
						hideButton: true,
						autoHideTimeout: 5000
					});
				})
				.catch(() => {
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'error',
						label: imageSizeTooLargeSnackbar,
						hideButton: true,
						autoHideTimeout: 5000
					});
				});
		},
		[createSnackbar, imageSizeTooLargeSnackbar, roomId, setRoomPictureUpdated, updatedImageSnackbar]
	);

	const onDeleteGroupImage = useCallback(() => {
		RoomsApi.deleteRoomPicture(roomId)
			.then(() => {
				setRoomPictureDeleted(roomId);
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'info',
					label: deletedImageSnackbar,
					hideButton: true,
					autoHideTimeout: 5000
				});
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'error',
					label: errorDeleteImageSnackbar,
					hideButton: true,
					autoHideTimeout: 5000
				});
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId]);

	const hoverContainer = useMemo(
		() => (
			<Container height="fit">
				{roomType === RoomType.GROUP && iAmOwner && (
					<HoverContainer
						orientation="horizontal"
						mainAlignment="flex-end"
						crossAlignment="flex-start"
						padding={{ top: 'small', right: 'small' }}
						height="fit"
						data-testid="hover_container"
					>
						<Tooltip
							placement="bottom"
							label={roomPictureUpdatedAt != null ? updatePictureLabel : uploadPictureLabel}
						>
							<FileLoader
								onChange={handleGroupPictureChange}
								icon="Upload"
								iconColor="gray6"
								size="large"
								data-testid="upload_button"
							/>
						</Tooltip>
						{!!picture && (
							<Tooltip placement="bottom" label={resetPictureLabel}>
								<IconButton
									icon="RefreshOutline"
									iconColor="gray6"
									size="large"
									onClick={onDeleteGroupImage}
									data-testid="delete_button"
								/>
							</Tooltip>
						)}
					</HoverContainer>
				)}

				{/* TODO: this is for the preview handling of the image
				hasPicture && (
					<HoverContainer
						mainAlignment="flex-end"
						crossAlignment="center"
						// TODO: check this measures and convert them to rem
						height={roomType === RoomType.Group ? (iAmOwner ? '103px' : '147px') : '147px'}
					>
						<IconButton icon="EyeOutline" iconColor="gray6" size="extralarge" />
					</HoverContainer>
				) */}
			</Container>
		),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[picture, iAmOwner, onDeleteGroupImage, roomType]
	);

	return (
		<>
			{!picture && (
				<BackgroundContainer
					color={calculateAvatarColor(
						roomType === RoomType.ONE_TO_ONE ? memberName || '' : roomName
					)}
					hasHoverGradient={hasHoverGradient}
					mainAlignment="flex-end"
					minHeight="10rem"
					maxHeight="10rem"
					data-testid="background_container"
				>
					<GradientContainer>
						{hoverContainer}
						{roomType === RoomType.ONE_TO_ONE && userInfo}
						{roomType === RoomType.GROUP && roomInfo}
					</GradientContainer>
				</BackgroundContainer>
			)}
			{picture && (
				<Container background="gray6" height="fit">
					<PictureContainer
						hasPicture={!!picture}
						picture={picture}
						//  TODO: remove hasHover when the preview of the image is implemented
						hasHover={roomType === RoomType.GROUP && iAmOwner}
						mainAlignment="flex-end"
						height="15.625rem"
						data-testid="picture_container"
					>
						<GradientContainer>
							{hoverContainer}
							{roomType === RoomType.ONE_TO_ONE && userInfo}
							{roomType === RoomType.GROUP && roomInfo}
						</GradientContainer>
					</PictureContainer>
				</Container>
			)}
		</>
	);
};

export default RoomPictureHandler;
