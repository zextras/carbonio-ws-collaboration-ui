/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useMemo } from 'react';

import {
	Container,
	CreateSnackbarFn,
	FileLoader,
	IconButton,
	Padding,
	SnackbarManagerContext,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import RoomPictureHandler from './RoomPictureHandler';
import { RoomsApi } from '../../../../network';
import {
	getMyOwnershipOfTheRoom,
	getNumbersOfRoomMembers,
	getPictureUpdatedAt,
	getRoomNameSelector
} from '../../../../store/selectors/RoomsSelectors';
import { getCapability } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { CapabilityType } from '../../../../types/store/SessionTypes';

type RoomPictureProps = {
	roomId: string;
};

const NameWrapText = styled(Text)<{ $hasPicture: boolean }>`
	white-space: unset;
	overflow: unset;
	text-overflow: unset;
	word-break: break-word;
	text-shadow: ${({ $hasPicture }): string | false =>
		$hasPicture && '0.063rem 0.063rem 0.25rem #111'};
`;

const CustomText = styled(Text)<{ $hasPicture: boolean }>`
	text-overflow: ellipsis;
	text-shadow: ${({ $hasPicture }): string | false =>
		$hasPicture && '0.063rem 0.063rem 0.25rem #111'};
`;

const HoverActions = styled(Container)`
	position: absolute;
	top: 0;
	right: 0;
`;

const CustomIconButton = styled(IconButton)`
	&:hover {
		background-color: rgba(0, 0, 0, 0.5);
	}
`;

const CustomFileLoader = styled(FileLoader)`
	&:hover {
		background-color: rgba(0, 0, 0, 0.5);
	}
`;

const GroupRoomPictureHandler: FC<RoomPictureProps> = ({ roomId }) => {
	const maxRoomImageSize = useStore((store) =>
		getCapability(store, CapabilityType.MAX_ROOM_IMAGE_SIZE)
	);

	const [t] = useTranslation();
	const oneMemberAccordionTitle = t('participantsList.oneMemberAccordionTitle', 'One member');
	const moreMembersAccordionTitle = t('participantsList.moreMembersAccordionTitle', `members`);
	const uploadPictureLabel = t('tooltip.room.uploadPicture', 'Upload picture');
	const updatePictureLabel = t('tooltip.room.updatePicture', 'Update picture');
	const resetPictureLabel = t('tooltip.room.resetPicture', 'Reset picture');
	const updatedImageSnackbar = t(
		'settings.room.updatedPictureCorrectly',
		'New avatar has been successfully uploaded'
	);
	const imageSizeTooLargeSnackbar = t(
		'settings.room.pictureSizeTooLarge',
		`Something went wrong, remember that the maximum size for a Group’s avatar image is ${maxRoomImageSize}kb`,
		{ size: maxRoomImageSize }
	);
	const errorDeleteImageSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);
	const deletedImageSnackbar = t(
		'settings.room.deletedImageCorrectly',
		'Group avatar has been successfully reset to the original one'
	);

	const roomName: string | undefined = useStore((state) => getRoomNameSelector(state, roomId));
	const numberOfMembers: number = useStore((state) => getNumbersOfRoomMembers(state, roomId));
	const roomPictureUpdatedAt: string | undefined = useStore((state) =>
		getPictureUpdatedAt(state, roomId)
	);
	const sessionId: string | undefined = useStore((store) => store.session.id);
	const iAmOwner: boolean = useStore((state) => getMyOwnershipOfTheRoom(state, sessionId, roomId));

	const numberOfParticipantsLabel = useMemo(() => {
		if (numberOfMembers === 1) {
			return oneMemberAccordionTitle;
		}
		return `${numberOfMembers} ${moreMembersAccordionTitle}`;
	}, [numberOfMembers, oneMemberAccordionTitle, moreMembersAccordionTitle]);

	const picture = useMemo(() => {
		if (roomPictureUpdatedAt) {
			return `${RoomsApi.getURLRoomPicture(roomId)}?${roomPictureUpdatedAt}`;
		}
		return false;
	}, [roomId, roomPictureUpdatedAt]);

	const roomInfo = useMemo(
		() => (
			<Container
				orientation="vertical"
				crossAlignment="flex-start"
				mainAlignment="flex-end"
				padding={{ left: 'large', bottom: 'large', right: 'large' }}
			>
				<NameWrapText color="gray6" $hasPicture={!!picture}>
					{roomName}
				</NameWrapText>
				<Padding top="extrasmall" />
				<CustomText size="small" color="gray6" $hasPicture={!!picture}>
					{numberOfParticipantsLabel}
				</CustomText>
			</Container>
		),
		[picture, roomName, numberOfParticipantsLabel]
	);

	const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	const handleGroupPictureChange = useCallback(
		(e) => {
			RoomsApi.updateRoomPicture(roomId, e.target.files[0])
				.then(() => {
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
		[createSnackbar, imageSizeTooLargeSnackbar, roomId, updatedImageSnackbar]
	);

	const onDeleteGroupImage = useCallback(() => {
		RoomsApi.deleteRoomPicture(roomId)
			.then(() => {
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
	}, [createSnackbar, deletedImageSnackbar, errorDeleteImageSnackbar, roomId]);

	const hoverActions = useMemo(() => {
		if (iAmOwner) {
			return (
				<HoverActions
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="flex-start"
					padding={{ top: 'small', right: 'small' }}
					height="fit"
					width="fit"
					data-testid="hover_container"
				>
					<Tooltip
						placement="bottom"
						label={roomPictureUpdatedAt != null ? updatePictureLabel : uploadPictureLabel}
					>
						<CustomFileLoader
							onChange={handleGroupPictureChange}
							icon="Upload"
							iconColor="gray6"
							size="large"
							data-testid="upload_button"
							onClick={(): null => null}
						/>
					</Tooltip>
					{!!picture && (
						<Tooltip placement="bottom" label={resetPictureLabel}>
							<CustomIconButton
								icon="RefreshOutline"
								iconColor="gray6"
								size="large"
								onClick={onDeleteGroupImage}
								data-testid="delete_button"
							/>
						</Tooltip>
					)}
				</HoverActions>
			);
		}
		return undefined;
	}, [
		handleGroupPictureChange,
		iAmOwner,
		onDeleteGroupImage,
		picture,
		resetPictureLabel,
		roomPictureUpdatedAt,
		updatePictureLabel,
		uploadPictureLabel
	]);

	return (
		<RoomPictureHandler
			title={roomName}
			conversationInfo={roomInfo}
			picture={picture}
			moreHoverActions={hoverActions}
		/>
	);
};

export default GroupRoomPictureHandler;
