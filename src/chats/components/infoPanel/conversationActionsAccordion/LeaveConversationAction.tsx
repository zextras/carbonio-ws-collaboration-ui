/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import LeaveConversationModal from './LeaveConversationModal';
import useRouting, { PAGE_INFO_TYPE } from '../../../../hooks/useRouting';
import { RoomsApi } from '../../../../network';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type LeaveProps = {
	roomId: string;
	type: string;
	iAmOneOfOwner: boolean;
	isInsideMeeting?: boolean;
};

const LeaveConversationAction: FC<LeaveProps> = ({
	roomId,
	type,
	iAmOneOfOwner,
	isInsideMeeting
}) => {
	const [t] = useTranslation();
	const leaveLabel: string = useMemo(() => {
		if (type === RoomType.GROUP) {
			return t('modal.leaveGroup', 'Leave Group');
		}
		return t('modal.leaveRoom', 'Leave Room');
	}, [t, type]);

	const sessionId: string | undefined = useStore((state) => state.session.id);

	const [leaveConversationModalOpen, setLeaveConversationModalOpen] = useState<boolean>(false);

	const { goToMainPage, goToInfoPage } = useRouting();

	const padding = useMemo(
		() =>
			!iAmOneOfOwner
				? { top: 'small', bottom: 'large' }
				: isInsideMeeting
					? { top: 'small', bottom: 'large' }
					: { top: 'small' },
		[iAmOneOfOwner, isInsideMeeting]
	);

	const leaveConversation = useCallback(() => {
		if (sessionId) {
			RoomsApi.deleteRoomMember(roomId, sessionId).then(() => {
				if (isInsideMeeting) {
					goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
				} else {
					goToMainPage();
				}
			});
		}
	}, [goToInfoPage, goToMainPage, isInsideMeeting, roomId, sessionId]);

	const closeModal = useCallback(() => setLeaveConversationModalOpen(false), []);

	return (
		<Container>
			<ActionComponent
				icon="LogOut"
				actionColor="error"
				padding={padding}
				label={leaveLabel}
				withArrow
				action={(): void => setLeaveConversationModalOpen(true)}
				isInsideMeeting={isInsideMeeting}
				actionTestId="leaveAction"
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
