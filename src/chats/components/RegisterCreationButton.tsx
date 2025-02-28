/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import {
	ACTION_TYPES,
	NewAction,
	registerActions,
	removeActions
} from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import ChatCreationModal from './creationModal/ChatCreationModal';
import { CHATS_APP_ID } from '../../constants/appConstants';
import { getAttribute } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';

const RegisterCreationButton = (): ReactElement => {
	const [t] = useTranslation();
	const [newChatModal, setNewChatModal] = useState(false);
	const createChatLabel = 'create-chat';

	const privateChatCreation = useStore((store) => getAttribute(store, 'privateChatCreation'));
	const groupChatCreation = useStore((store) => getAttribute(store, 'groupChatCreation'));

	const newAction = useMemo(
		(): NewAction => ({
			id: createChatLabel,
			label: t('action.newChat', 'New Chat'),
			icon: 'WscOutline',
			execute: (): void => setNewChatModal(true),
			group: CHATS_APP_ID,
			primary: true
		}),
		[t]
	);

	useEffect(() => {
		if (privateChatCreation || groupChatCreation) {
			registerActions<NewAction>({
				id: createChatLabel,
				type: ACTION_TYPES.NEW,
				action: () => newAction
			});
		}
		return (): void => removeActions(createChatLabel);
	}, [groupChatCreation, newAction, privateChatCreation, t]);

	return <ChatCreationModal open={newChatModal} onClose={(): void => setNewChatModal(false)} />;
};

export default RegisterCreationButton;
