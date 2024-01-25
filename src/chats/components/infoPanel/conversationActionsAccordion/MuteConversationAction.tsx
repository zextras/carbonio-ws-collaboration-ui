/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import { RoomsApi } from '../../../../network';
import { getRoomMutedSelector } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type MuteProps = {
	roomId: string;
	isInsideMeeting?: boolean;
	roomType?: string;
	emptyRoom?: boolean;
};

const MuteConversationAction: FC<MuteProps> = ({
	roomId,
	isInsideMeeting,
	roomType,
	emptyRoom
}) => {
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

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const padding = useMemo(
		() =>
			emptyRoom && roomType === RoomType.ONE_TO_ONE
				? { top: 'large', bottom: 'large' }
				: { top: 'large' },
		[emptyRoom, roomType]
	);

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
			padding={padding}
			label={!isMuted ? muteNotificationsLabel : activateNotificationsLabel}
			action={muteConversation}
			isInsideMeeting={isInsideMeeting}
		/>
	);
};

export default MuteConversationAction;
