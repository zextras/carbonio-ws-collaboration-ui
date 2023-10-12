/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import EditConversationModal from './EditConversationModal';

type EditProps = {
	roomId: string;
	isInsideMeeting?: boolean;
};

const EditConversationAction: FC<EditProps> = ({ roomId, isInsideMeeting }) => {
	const [t] = useTranslation();
	const editLabel = t('action.editDetails', 'Edit details');

	const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

	const openModal = useCallback(() => {
		setEditModalOpen(true);
	}, []);

	const closeModal = useCallback(() => {
		setEditModalOpen(false);
	}, []);

	return (
		<Container>
			<ActionComponent
				icon="InfoOutline"
				actionColor="primary"
				padding={{ top: 'small' }}
				label={editLabel}
				withArrow
				action={openModal}
				isInsideMeeting={isInsideMeeting}
			/>
			{editModalOpen && (
				<EditConversationModal
					roomId={roomId}
					editModalOpen={editModalOpen}
					closeModal={closeModal}
				/>
			)}
		</Container>
	);
};

export default EditConversationAction;
