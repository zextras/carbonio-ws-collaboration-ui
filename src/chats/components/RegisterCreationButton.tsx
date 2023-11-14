/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import { ACTION_TYPES, registerActions, removeActions } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import ChatCreationModal from './creationModal/ChatCreationModal';
import { CHATS_APP_ID } from '../../constants/appConstants';

const RegisterCreationButton = (): ReactElement => {
	const [t] = useTranslation();
	const [newChatModal, setNewChatModal] = useState(false);
	const createChatLabel = 'create-chat';

	useEffect(() => {
		registerActions({
			id: createChatLabel,
			type: ACTION_TYPES.NEW,
			action: () => ({
				id: 'create-chat',
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				type: ACTION_TYPES.NEW,
				label: t('action.newChat', 'New Chat'),
				icon: 'MessageSquareOutline',
				onClick: () => setNewChatModal(true),
				group: CHATS_APP_ID,
				primary: true,
				disabled: false
			})
		});
		return () => removeActions(createChatLabel);
	}, [t]);

	const CreationModal: ReactElement = useMemo(
		() => <ChatCreationModal open={newChatModal} onClose={(): void => setNewChatModal(false)} />,
		[newChatModal]
	);

	return CreationModal;
};

export default RegisterCreationButton;
