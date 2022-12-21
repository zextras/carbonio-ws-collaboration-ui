/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Container,
	CreateSnackbarFn,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeader
} from '@zextras/carbonio-shell-ui';
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UsersApi } from '../../network';
import { getCapability } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { CapabilityType } from '../../types/store/SessionTypes';
import ProfileSettings from './ProfileSettings';

type CreateSnackbarFn = typeof CreateSnackbarFn;

type SettingsProps = {
	id?: string | undefined;
};

const Settings: FC<SettingsProps> = ({ id }) => {
	const maxRoomImageSize = useStore((store) =>
		getCapability(store, CapabilityType.MAX_ROOM_IMAGE_SIZE)
	);

	const [t] = useTranslation();
	const settingsTitle = t('settings.title', 'Chats Alpha - for testing purpose only');
	const updatedImageSnackbar = t(
		'settings.profile.updatedPictureCorrectly',
		'New avatar has been successfully uploaded'
	);
	const imageSizeTooLargeSnackbar = t(
		'settings.profile.pictureSizeTooLarge',
		`Something went wrong, remember that the maximum size for an avatar image is ${maxRoomImageSize}kb`,
		{ size: maxRoomImageSize }
	);
	const errorDeleteImageSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);
	const deletedImageSnackbar = t(
		'settings.profile.deletedUserImageCorrectly',
		'Avatar has been successfully reset to the original one'
	);

	const setUserPictureUpdated = useStore((state) => state.setUserPictureUpdated);
	const setUserPictureDeleted = useStore((state) => state.setUserPictureDeleted);

	const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	const [picture, setPicture] = useState<false | File>(false);
	const [deletePicture, setDeletePicture] = useState(false);

	const isEnabled = useMemo(() => !!picture || deletePicture, [deletePicture, picture]);

	// saves the elements that have been modified
	const saveSettings = useCallback(() => {
		// if a user change the picture
		if (picture) {
			UsersApi.changeUserPicture(id || '', picture)
				.then(() => {
					setUserPictureUpdated(id || '', new Date().toISOString());
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'info',
						label: updatedImageSnackbar,
						hideButton: true,
						autoHideTimeout: 5000
					});
					setPicture(false);
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
		}

		// if a user delete the pictures
		if (deletePicture) {
			UsersApi.deleteUserPicture(id || '')
				.then(() => {
					setUserPictureDeleted(id || '');
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'info',
						label: deletedImageSnackbar,
						hideButton: true,
						autoHideTimeout: 5000
					});
					setDeletePicture(false);
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
		}
	}, [
		picture,
		deletePicture,
		id,
		setUserPictureUpdated,
		createSnackbar,
		updatedImageSnackbar,
		imageSizeTooLargeSnackbar,
		setUserPictureDeleted,
		deletedImageSnackbar,
		errorDeleteImageSnackbar
	]);

	// sets all the values that has been changed to false
	const onClose = useCallback(() => {
		setPicture(false);
		setDeletePicture(false);
	}, []);

	return (
		<Container
			mainAlignment="flex-start"
			background={'gray5'}
			style={{ overflowY: 'auto' }}
			data-testid="settings_container"
		>
			<SettingsHeader
				onSave={saveSettings}
				onCancel={onClose}
				isDirty={isEnabled}
				title={settingsTitle}
			/>
			<Container
				height="fit"
				background={'gray5'}
				padding={{ vertical: 'large', horizontal: 'medium' }}
			>
				<ProfileSettings
					picture={picture}
					setPicture={setPicture}
					sessionId={id}
					setToDelete={setDeletePicture}
					toDelete={deletePicture}
				/>
			</Container>
		</Container>
	);
};
export default Settings;
