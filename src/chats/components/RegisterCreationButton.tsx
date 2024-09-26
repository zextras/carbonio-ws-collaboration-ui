/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useState } from 'react';

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
				id: createChatLabel,
				label: t('action.newChat', 'New Chat'),
				icon: 'WscOutline',
				onClick: (): void => setNewChatModal(true),
				group: CHATS_APP_ID,
				primary: true
			})
		});
		return (): void => removeActions(createChatLabel);
	}, [t]);

	return <ChatCreationModal open={newChatModal} onClose={(): void => setNewChatModal(false)} />;
};

export default RegisterCreationButton;
