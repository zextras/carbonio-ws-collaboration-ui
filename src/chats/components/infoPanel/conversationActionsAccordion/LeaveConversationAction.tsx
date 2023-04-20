/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import LeaveConversationModal from './LeaveConversationModal';
import useRouting from '../../../../hooks/useRouting';
import { RoomsApi } from '../../../../network';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type LeaveProps = {
	roomId: string;
	type: string;
	iAmOneOfOwner: boolean;
};

const LeaveConversationAction: FC<LeaveProps> = ({ roomId, type, iAmOneOfOwner }) => {
	const [t] = useTranslation();
	const leaveLabel: string = useMemo(() => {
		if (type === RoomType.GROUP) {
			return t('modal.leaveGroup', 'Leave Group');
		}
		return t('modal.leaveRoom', 'Leave Room');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type]);
	const sessionId: string | undefined = useStore((state) => state.session.id);
	const deleteRoom = useStore((state) => state.deleteRoom);
	const [leaveConversationModalOpen, setLeaveConversationModalOpen] = useState<boolean>(false);

	const { goToMainPage } = useRouting();

	const leaveConversation = useCallback(() => {
		if (sessionId) {
			RoomsApi.deleteRoomMember(roomId, sessionId)
				.then(() => {
					deleteRoom(roomId);
					goToMainPage();
				})
				.catch(() => null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId, sessionId]);

	const closeModal = useCallback(() => {
		setLeaveConversationModalOpen(false);
	}, []);

	return (
		<Container>
			<ActionComponent
				icon="LogOut"
				actionColor="error"
				padding={!iAmOneOfOwner ? { top: 'small', bottom: 'large' } : { top: 'small' }}
				label={leaveLabel}
				withArrow
				action={(): void => setLeaveConversationModalOpen(true)}
			/>
			{leaveConversationModalOpen && (
				<LeaveConversationModal
					leaveConversationModalOpen={leaveConversationModalOpen}
					leaveConversation={leaveConversation}
					closeModal={closeModal}
					roomType={type}
				/>
			)}
		</Container>
	);
};

export default LeaveConversationAction;
