/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useState, useMemo } from 'react';

import { Button, Container, Input } from '@zextras/carbonio-design-system';

import useStore from '../../../store/Store';

type ConversationProps = {
	roomId: string;
};

const ConversationSearchPanel: FC<ConversationProps> = ({ roomId }) => {
	const [searchText, setSearchText] = useState<string>('');

	const results = useStore((state) => state.chatsRegistry[roomId]?.searchResults);

	const search = useCallback(() => {
		const { xmppClient } = useStore.getState().connections;
		xmppClient.fullTextSearch(roomId, searchText);
	}, [roomId, searchText]);

	const messageResults = useMemo(
		() => results?.map((message) => <Container key={message.id}>{message.text}</Container>),
		[results]
	);

	return (
		<Container>
			<Container background="gray5" height="fit" orientation="horizontal">
				<Input value={searchText} onChange={(e) => setSearchText(e.target.value)} />
				<Button onClick={search} icon={'Search'} />
			</Container>
			<Container>{messageResults}</Container>
		</Container>
	);
};

export default ConversationSearchPanel;
