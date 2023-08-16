/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SnackbarManagerContext, CreateSnackbarFn } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import { RoomsApi } from '../../../network';
import { getRoomMutedSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';

type MuteProps = {
	roomId: string;
};

type CreateSnackbarFn = typeof CreateSnackbarFn;

const MuteConversationAction: FC<MuteProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const muteNotificationsLabel = t('action.muteNotifications', 'Mute notifications');
	const activateNotificationsLabel = t('action.activateNotifications', 'activate notifications');
	const undoLabel = t('action.undo', 'Undo');
	const notificationsActivatedForThisChatLabel = t(
		'feedback.notificationsActivatedForThisChat',
		'Notifications activated for this chat'
	);
	const notificationsMutedForThisChatLabel = t(
		'feedback.notificationsMutedForThisChat',
		'Notifications muted for this chat'
	);
	const isMuted: boolean | undefined = useStore((state) => getRoomMutedSelector(state, roomId));

	// TODO fix type of createSnackbar
	const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	const muteConversation = useCallback(() => {
		if (isMuted) {
			RoomsApi.unmuteRoomNotification(roomId)
				.then(() => {
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'info',
						label: notificationsActivatedForThisChatLabel,
						actionLabel: undoLabel,
						onActionClick: () => RoomsApi.muteRoomNotification(roomId)
					});
				})
				.catch(() => null);
		} else {
			RoomsApi.muteRoomNotification(roomId)
				.then(() => {
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'info',
						label: notificationsMutedForThisChatLabel,
						actionLabel: undoLabel,
						onActionClick: () => RoomsApi.unmuteRoomNotification(roomId)
					});
				})
				.catch(() => null);
		}
	}, [
		isMuted,
		roomId,
		createSnackbar,
		notificationsActivatedForThisChatLabel,
		undoLabel,
		notificationsMutedForThisChatLabel
	]);

	return (
		<ActionComponent
			icon={!isMuted ? 'BellOffOutline' : 'BellOutline'}
			actionColor="primary"
			padding={{ top: 'large' }}
			label={!isMuted ? muteNotificationsLabel : activateNotificationsLabel}
			action={muteConversation}
		/>
	);
};

export default MuteConversationAction;
