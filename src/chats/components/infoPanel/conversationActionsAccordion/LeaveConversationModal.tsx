/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { RoomType } from '../../../../types/store/RoomTypes';

type LeaveModalProps = {
	leaveConversationModalOpen: boolean;
	leaveConversation: () => void;
	closeModal: () => void;
	roomType: string;
};

const LeaveConversationModal: FC<LeaveModalProps> = ({
	leaveConversationModalOpen,
	leaveConversation,
	closeModal,
	roomType
}) => {
	const [t] = useTranslation();
	const closeLabel = t('action.close', 'Close');

	const leaveConversationTitle: string = useMemo(() => {
		if (roomType === RoomType.GROUP) {
			return t('modal.leaveGroup', 'Leave Group');
		}
		return t('modal.leaveRoom', 'Leave Room');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomType]);
	const leaveConversationDescriptionLabel: string = useMemo(() => {
		if (roomType === RoomType.GROUP) {
			return t('modal.leaveGroupLabel', 'Are you sure to leave this Group?');
		}
		return t('modal.leaveRoomLabel', 'Are you sure to leave this Room?');
	}, [roomType, t]);

	return (
		<Modal
			size="small"
			open={leaveConversationModalOpen}
			title={leaveConversationTitle}
			confirmLabel={t('action.leave', 'Leave')}
			onConfirm={leaveConversation}
			confirmColor="error"
			showCloseIcon
			onClose={closeModal}
			closeIconTooltip={closeLabel}
			data-testid="leave_modal"
		>
			<Container padding={{ vertical: 'large' }}>
				<Text>{leaveConversationDescriptionLabel}</Text>
			</Container>
		</Modal>
	);
};

export default LeaveConversationModal;
