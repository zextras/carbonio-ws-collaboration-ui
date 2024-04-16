/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useMemo, useState } from 'react';

import { Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import GalListItem from './GalListItem';
import {
	autoCompleteGalRequest,
	AutoCompleteGalResponse
} from '../../../../network/soap/AutoCompleteRequest';
import { Member } from '../../../../types/store/RoomTypes';

const CustomContainer = styled(Container)`
	cursor: default;
`;

export type FilteredConversation = {
	roomId: string;
	name: string;
	roomType: string;
	lastMessageTimestamp: number;
	members: Member[];
};

type FilteredGalProps = {
	input: string;
	expanded: boolean;
};

const FilteredGal: React.FC<FilteredGalProps> = ({ expanded, input }) => {
	const [t] = useTranslation();
	// TODO: add translation key
	const createNewChatLabel = t('', 'Create new chat with:');

	const [filteredGal, setFilteredGal] = useState<AutoCompleteGalResponse>([]);

	// TODO: debounce input
	useEffect(() => {
		autoCompleteGalRequest(input)
			.then((response: AutoCompleteGalResponse) => {
				console.log(response);
				setFilteredGal(response);
			})
			.catch((err: Error) => {
				console.error(err);
			});
	}, [input]);

	const galUsers = useMemo(() => {
		if (size(filteredGal) > 0) {
			return map(filteredGal, (contactMatch) => (
				<GalListItem contact={contactMatch} key={contactMatch.zimbraId} />
			));
		}
		return (
			<CustomContainer
				mainAlignment="flex-start"
				padding={{ vertical: '2rem', horizontal: '1rem' }}
			>
				No match
			</CustomContainer>
		);
	}, [filteredGal]);

	return (
		<Container mainAlignment="flex-start" crossAlignment="flex-start" data-testid="filtered_gal">
			<Divider />
			<Padding horizontal="large" vertical="small">
				<Text size="small" color="primary">
					{createNewChatLabel}
				</Text>
			</Padding>
			{galUsers}
		</Container>
	);
};

export default FilteredGal;
