/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useMemo, useState } from 'react';

import { Container, Divider, IconButton, Padding, Text } from '@zextras/carbonio-design-system';
import { differenceWith, map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import GalListItem from './GalListItem';
import {
	autoCompleteGalRequest,
	AutoCompleteGalResponse
} from '../../../../network/soap/AutoCompleteRequest';
import { getSingleConversationsUserId } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomText = styled(Text)`
	text-align: center;
`;

type FilteredGalProps = {
	input: string;
	expanded: boolean;
};

const FilteredGal: React.FC<FilteredGalProps> = ({ expanded, input }) => {
	const [t] = useTranslation();
	// TODO: add translation key
	const createNewChatLabel = t('', 'Create new chat with:');
	const noMatchLabel = t('', 'There are no items that match this search in your company.');

	const [filteredGal, setFilteredGal] = useState<AutoCompleteGalResponse>([]);

	const singleConversationsUserId = useStore(getSingleConversationsUserId);

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
		const filteredGalWithUserId = differenceWith(
			filteredGal,
			singleConversationsUserId,
			(gal, userId) => gal.zimbraId === userId
		);
		if (size(filteredGalWithUserId) > 0) {
			return map(filteredGalWithUserId, (contactMatch) => (
				<GalListItem contact={contactMatch} expanded={expanded} key={contactMatch.zimbraId} />
			));
		}
		return (
			<CustomContainer
				mainAlignment="flex-start"
				padding={{ vertical: '2rem', horizontal: '1rem' }}
			>
				<CustomText
					color="gray1"
					size="small"
					weight="light"
					overflow={expanded ? 'break-word' : 'ellipsis'}
				>
					{noMatchLabel}
				</CustomText>
			</CustomContainer>
		);
	}, [expanded, filteredGal, noMatchLabel, singleConversationsUserId]);

	return (
		<Container mainAlignment="flex-start" crossAlignment="flex-start" data-testid="filtered_gal">
			<Divider />
			{expanded ? (
				<Padding horizontal="large" vertical="small">
					<Text size="small" color="primary">
						{createNewChatLabel}
					</Text>
				</Padding>
			) : (
				<Container width="fill" height="fit" padding={{ all: 'small' }}>
					<IconButton icon="Plus" size="large" onClick={() => null} />
				</Container>
			)}
			{galUsers}
		</Container>
	);
};

export default FilteredGal;
