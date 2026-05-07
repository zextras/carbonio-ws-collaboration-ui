/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import ConversationSearchPanelRest from './ConversationSearchPanelRest';
import ConversationSearchPanelXmpp from './ConversationSearchPanelXmpp';
import { getIsMongooseIM } from '../../../store/selectors/ConnectionSelector';
import useStore from '../../../store/Store';

type ConversationSearchPanelProps = {
	roomId: string;
	goToChatView: () => void;
};

/**
 * Barrel wrapper: picks the XMPP (MongooseIM) or REST (common-socket) implementation
 * based on the active connection type.
 */
const ConversationSearchPanel: FC<ConversationSearchPanelProps> = (props) => {
	const isMongooseIM = useStore(getIsMongooseIM);
	return isMongooseIM ? (
		<ConversationSearchPanelXmpp {...props} />
	) : (
		<ConversationSearchPanelRest {...props} />
	);
};

export default ConversationSearchPanel;
