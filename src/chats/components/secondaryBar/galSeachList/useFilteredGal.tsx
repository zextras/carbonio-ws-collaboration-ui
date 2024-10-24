/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Container, Divider, Icon, Padding, Text } from '@zextras/carbonio-design-system';
import { differenceWith, map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import GalListItem from './GalListItem';
import { searchUsersByFeatureRequest } from '../../../../network/soap/SearchUsersByFeatureRequest';
import { getSingleConversationsUserId } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { SearchUsersByFeatureSoapResponse } from '../../../../types/network/soap/searchUsersByFeatureRequest';
import { SecondaryBarInfoText } from '../SecondaryBarView';

const CustomContainer = styled(Container)`
	cursor: default;
	> div > button > div {
		text-transform: capitalize !important;
	}
`;

const CustomText = styled(Text)`
	cursor: default;
`;

const CustomButton = styled(Button)`
	padding: 0.25rem;
`;

const useFilteredGal = (
	input: string,
	expanded: boolean
): {
	galResultSize: number;
	FilteredGal: JSX.Element | undefined;
} => {
	const [t] = useTranslation();
	const createNewChatLabel = t('participantsList.creationList.title', 'Create new chat with:');
	const errorLabel = t(
		'participantsList.creationList.searchFailure',
		'There seems to be a problem with your search, please retry.'
	);
	const retryLabel = t('action.retry', 'Retry');

	const [filteredGal, setFilteredGal] = useState<SearchUsersByFeatureSoapResponse>([]);
	const [requestStatus, setRequestStatus] = useState<'loading' | 'success' | 'error'>('loading');

	const singleConversationsUserId = useStore(getSingleConversationsUserId);

	const searchOnGal = useCallback((text: string) => {
		if (text !== '') {
			setRequestStatus('loading');
			searchUsersByFeatureRequest(text)
				.then((response: SearchUsersByFeatureSoapResponse) => {
					setRequestStatus('success');
					setFilteredGal(response);
				})
				.catch(() => setRequestStatus('error'));
		}
	}, []);

	useEffect(() => {
		searchOnGal(input);
	}, [input, searchOnGal]);

	const GalSearchHeader = useMemo(
		() =>
			expanded ? (
				<Padding horizontal="large" vertical="large" bottom="small">
					<CustomText size="small" color="primary">
						{createNewChatLabel}
					</CustomText>
				</Padding>
			) : (
				<Container width="fill" height="fit" padding={{ all: 'small' }}>
					<Button type="ghost" icon="Plus" size="large" onClick={() => null} />
				</Container>
			),
		[expanded, createNewChatLabel]
	);

	const GalUsersComponent = useMemo(() => {
		const filteredGalWithUserId = differenceWith(
			filteredGal,
			singleConversationsUserId,
			(gal, userId) => gal.id === userId
		);
		return map(filteredGalWithUserId, (contactInfo) => (
			<GalListItem contact={contactInfo} expanded={expanded} key={contactInfo.id} />
		));
	}, [expanded, filteredGal, singleConversationsUserId]);

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
				<SecondaryBarInfoText
					color="gray1"
					size="small"
					weight="light"
					overflow={expanded ? 'break-word' : 'ellipsis'}
				>
					{errorLabel}
				</SecondaryBarInfoText>
				{expanded ? (
					<CustomButton color="gray1" onClick={() => searchOnGal(input)} label={retryLabel} />
				) : (
					<Button type="ghost" icon="Refresh" onClick={() => searchOnGal(input)} />
				)}
			</CustomContainer>
		),
		[errorLabel, expanded, input, retryLabel, searchOnGal]
	);

	const FilteredGal = useMemo(
		() => (
			<Container mainAlignment="flex-start" crossAlignment="flex-start" data-testid="filtered_gal">
				<Divider />
				{GalSearchHeader}
				{requestStatus === 'success' && GalUsersComponent}
				{requestStatus === 'loading' && PendingComponent}
				{requestStatus === 'error' && ErrorComponent}
			</Container>
		),
		[requestStatus, GalSearchHeader, GalUsersComponent, PendingComponent, ErrorComponent]
	);

	return {
		galResultSize: size(GalUsersComponent),
		FilteredGal:
			size(GalUsersComponent) === 0 && requestStatus === 'success' ? undefined : FilteredGal
	};
};
export default useFilteredGal;
