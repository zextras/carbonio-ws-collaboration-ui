/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';

import { TextMessage } from '../../../types/store/ChatsRegistryTypes';

const SearchResultMessage = ({ message }: { message: TextMessage }): React.ReactElement => (
	<Container height="fit" crossAlignment="flex-start">
		<Text>{message.text}</Text>
	</Container>
);
export default SearchResultMessage;
