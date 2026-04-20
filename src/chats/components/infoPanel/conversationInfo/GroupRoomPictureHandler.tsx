/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, FormEvent, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import {
	Container,
	CreateSnackbarFn,
	FileLoader,
	Button,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import RoomPictureHandler from './RoomPictureHandler';
import { deleteRoomPicture, getURLRoomPicture, updateRoomPicture } from '../../../../network';
import {
	getOwnershipOfTheRoom,
	getNumbersOfRoomMembers,
	getPictureUpdatedAt,
	getRoomNameSelector
} from '../../../../store/selectors/RoomsSelectors';
import { getAttribute } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';

type RoomPictureProps = {
	roomId: string;
};

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

const CustomButton = styled(Button)`
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
	const maxRoomImageSize = useStore((store) => getAttribute(store, 'maxRoomPictureSize') as number);

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
		'attachments.upload.tooLarge',
		`The selected image is too large. Please upload a file smaller than ${maxRoomImageSize}MB.`,
		{ size: maxRoomImageSize }
	);
	const genericErrorSnackbar = t(
		'attachments.upload.genericError',
		'Something went wrong while uploading the image. Please try again.'
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
	const iAmOwner: boolean = useStore((state) => getOwnershipOfTheRoom(state, roomId));

	const numberOfParticipantsLabel = useMemo(() => {
		if (numberOfMembers === 1) {
			return oneMemberAccordionTitle;
		}
		return `${numberOfMembers} ${moreMembersAccordionTitle}`;
	}, [numberOfMembers, oneMemberAccordionTitle, moreMembersAccordionTitle]);

	const picture = useMemo(() => {
		if (roomPictureUpdatedAt) {
			return `${getURLRoomPicture(roomId)}?${roomPictureUpdatedAt}`;
		}
		return undefined;
	}, [roomId, roomPictureUpdatedAt]);

	const description = useMemo(
		() => (
			<CustomText size="small" color="gray6" $hasPicture={!!picture}>
				{numberOfParticipantsLabel}
			</CustomText>
		),
		[picture, numberOfParticipantsLabel]
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const handleGroupPictureChange = useCallback(
		(e: FormEvent) => {
			const inputElement = e.target as HTMLInputElement;
			const files = inputElement?.files;
			if (files) {
				updateRoomPicture(roomId, files[0])
					.then(() => {
						createSnackbar({
							key: new Date().toLocaleString(),
							severity: 'info',
							label: updatedImageSnackbar,
							hideButton: true,
							autoHideTimeout: 5000
						});
					})
					.catch((error: Error) => {
						if (error.message === 'File too large') {
							createSnackbar({
								key: new Date().toLocaleString(),
								severity: 'error',
								label: imageSizeTooLargeSnackbar,
								hideButton: true,
								autoHideTimeout: 5000
							});
						} else {
							createSnackbar({
								key: new Date().toLocaleString(),
								severity: 'error',
								label: genericErrorSnackbar,
								hideButton: true,
								autoHideTimeout: 5000
							});
						}
					});
			}
		},
		[createSnackbar, genericErrorSnackbar, imageSizeTooLargeSnackbar, roomId, updatedImageSnackbar]
	);

	const onDeleteGroupImage = useCallback(() => {
		deleteRoomPicture(roomId)
			.then(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'info',
					label: deletedImageSnackbar,
					hideButton: true,
					autoHideTimeout: 5000
				});
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'error',
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
							color="gray6"
							size="large"
							data-testid="upload_button"
						/>
					</Tooltip>
					{!!picture && (
						<Tooltip placement="bottom" label={resetPictureLabel}>
							<CustomButton
								type="ghost"
								icon="RefreshOutline"
								color="gray6"
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
			description={description}
			picture={picture}
			moreHoverActions={hoverActions}
		/>
	);
};

export default GroupRoomPictureHandler;
