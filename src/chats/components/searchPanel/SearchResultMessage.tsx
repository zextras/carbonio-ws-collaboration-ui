/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import SearchResultMessageRest from './SearchResultMessageRest';
import SearchResultMessageXmpp from './SearchResultMessageXmpp';
import { getIsMongooseIM } from '../../../store/selectors/ConnectionSelector';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/ChatsRegistryTypes';

interface SearchResultMessageProps {
	message: TextMessage;
	searchText: string;
}

/**
 * Barrel wrapper: picks the XMPP (MongooseIM) or REST (common-socket) implementation
 * based on the active connection type.
 */
const SearchResultMessage = (props: SearchResultMessageProps): React.ReactElement => {
	const isMongooseIM = useStore(getIsMongooseIM);
	return isMongooseIM ? (
		<SearchResultMessageXmpp {...props} />
	) : (
		<SearchResultMessageRest {...props} />
	);
};

export default SearchResultMessage;
