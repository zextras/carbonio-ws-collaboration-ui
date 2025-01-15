/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useMemo } from 'react';

import { Container, Icon, Text } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getUsersReadingMessage } from '../../../../../store/selectors/MarkersSelectors';
import useStore from '../../../../../store/Store';
import ReadByDropdownUser from '../../../UserInfoRow';

const CustomDropdown = styled(Container)`
	position: absolute;
	bottom: 1.5rem;
	right: -1rem;
	z-index: 3;
	border-radius: 1rem;
	box-shadow: 0 0 0.25rem rgba(166, 166, 166, 0.5);
	user-select: none;
`;

type ReadByProps = {
	roomId: string;
	stanzaId: string;
};
const ReadByDropdown = ({ roomId, stanzaId }: ReadByProps): ReactElement => {
	const [t] = useTranslation();
	const seenByLabel = t('readBy.title', 'Seen by:');

	const readingUsers = useStore((store) => getUsersReadingMessage(store, roomId, stanzaId));

	const ReadingUserList = useMemo(
		() =>
			map(readingUsers, (userId) => (
				<ReadByDropdownUser userId={userId} key={userId} displayPresence />
			)),
		[readingUsers]
	);

	return (
		<CustomDropdown
			id={`read-by-dropdown-${stanzaId}`}
			background="gray6"
			width="fit"
			height="fit"
			padding="medium"
			mainAlignment="flex-start"
			gap="0.5rem"
		>
			<Container
				orientation="horizontal"
				mainAlignment="flex-start"
				padding={{ vertical: 'extrasmall' }}
				gap="0.5rem"
			>
				<Icon icon="DoneAll" color="primary" />
				<Text size="small" color="gray1">
					{seenByLabel}
				</Text>
			</Container>
			<Container
				mainAlignment="flex-start"
				maxHeight="20vh"
				gap="0.5rem"
				style={{ overflowY: 'scroll' }}
			>
				{ReadingUserList}
			</Container>
		</CustomDropdown>
	);
};

export default ReadByDropdown;
