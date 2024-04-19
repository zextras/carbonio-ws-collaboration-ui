/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Divider,
	Icon,
	IconButton,
	Padding,
	Text,
	TextWithTooltip
} from '@zextras/carbonio-design-system';
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
	> div > button > div {
		text-transform: capitalize !important;
	}
`;

const CustomText = styled(TextWithTooltip)`
	text-align: center;
`;

const CustomButton = styled(Button)`
	padding: 0.25rem;
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
	const errorLabel = t('', 'There seems to be a problem with your search, please retry.');
	const retryLabel = t('', 'Retry');

	const [filteredGal, setFilteredGal] = useState<AutoCompleteGalResponse>([]);
	const [requestStatus, setRequestStatus] = useState<'loading' | 'success' | 'error'>('loading');

	const singleConversationsUserId = useStore(getSingleConversationsUserId);

	const searchOnGal = useCallback((text: string) => {
		setRequestStatus('loading');
		autoCompleteGalRequest(text)
			.then((response: AutoCompleteGalResponse) => {
				setRequestStatus('success');
				setFilteredGal(response);
			})
			.catch(() => setRequestStatus('error'));
	}, []);

	// TODO: debounce input
	useEffect(() => {
		searchOnGal(input);
	}, [input, searchOnGal]);

	const GalSearchHeader = useMemo(
		() =>
			expanded ? (
				<Padding horizontal="large" vertical="small">
					<Text size="small" color="primary">
						{createNewChatLabel}
					</Text>
				</Padding>
			) : (
				<Container width="fill" height="fit" padding={{ all: 'small' }}>
					<IconButton icon="Plus" size="large" onClick={() => null} />
				</Container>
			),
		[expanded, createNewChatLabel]
	);

	const GalUsersComponent = useMemo(() => {
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
			<CustomContainer padding={{ vertical: 'small', horizontal: 'large' }} height="fit">
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

	const PendingComponent = useMemo(
		() => (
			<CustomContainer padding={{ vertical: 'small', horizontal: 'large' }} height="fit">
				<Icon icon="Refresh" />
			</CustomContainer>
		),
		[]
	);

	const ErrorComponent = useMemo(
		() => (
			<CustomContainer padding={{ vertical: 'small', horizontal: 'large' }} height="fit" gap="1rem">
				<CustomText
					color="gray1"
					size="small"
					weight="light"
					overflow={expanded ? 'break-word' : 'ellipsis'}
				>
					{errorLabel}
				</CustomText>
				{expanded ? (
					<CustomButton color="gray1" onClick={() => searchOnGal(input)} label={retryLabel} />
				) : (
					<IconButton icon="Refresh" onClick={() => searchOnGal(input)} />
				)}
			</CustomContainer>
		),
		[errorLabel, expanded, input, retryLabel, searchOnGal]
	);

	return (
		<Container mainAlignment="flex-start" crossAlignment="flex-start" data-testid="filtered_gal">
			<Divider />
			{GalSearchHeader}
			{requestStatus === 'success' && GalUsersComponent}
			{requestStatus === 'loading' && PendingComponent}
			{requestStatus === 'error' && ErrorComponent}
		</Container>
	);
};

export default FilteredGal;
