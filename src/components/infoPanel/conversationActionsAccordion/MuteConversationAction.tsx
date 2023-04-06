/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SnackbarManagerContext } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import { RoomsApi } from '../../../network';
import { getRoomMutedSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';

type MuteProps = {
	roomId: string;
};

const MuteConversationAction: FC<MuteProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const muteNotificationsLabel = t('action.muteNotifications', 'Mute Notifications');
	const activateNotificationsLabel = t('action.activateNotifications', 'Activate Notifications');
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
	const setRoomMuted = useStore((state) => state.setRoomMuted);
	const setRoomUnmuted = useStore((state) => state.setRoomUnmuted);

	// TODO fix type of createSnackbar
	const createSnackbar: any = useContext(SnackbarManagerContext);

	const muteConversation = useCallback(() => {
		if (isMuted) {
			RoomsApi.unmuteRoomNotification(roomId)
				.then(() => {
					setRoomUnmuted(roomId);
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'info',
						label: notificationsActivatedForThisChatLabel,
						actionLabel: undoLabel,
						onActionClick: () => {
							RoomsApi.muteRoomNotification(roomId)
								.then(() => setRoomMuted(roomId))
								.catch(() => null);
						}
					});
				})
				.catch(() => null);
		} else {
			RoomsApi.muteRoomNotification(roomId)
				.then(() => {
					setRoomMuted(roomId);
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'info',
						label: notificationsMutedForThisChatLabel,
						actionLabel: undoLabel,
						onActionClick: () => {
							RoomsApi.unmuteRoomNotification(roomId)
								.then(() => setRoomUnmuted(roomId))
								.catch(() => null);
						}
					});
				})
				.catch(() => null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMuted, roomId]);

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
