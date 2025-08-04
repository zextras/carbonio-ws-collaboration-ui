/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import {
	Button,
	Container,
	Divider,
	Padding,
	Spinner,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { debounce, differenceWith, map, size, union } from 'lodash';
import { useTranslation } from 'react-i18next';

import GalListItem from './GalListItem';
import { searchUsersByFeatureRequest } from '../../../../network/soap/SearchUsersByFeatureRequest';
import { getSingleConversationsUserId } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import {
	ContactInfo,
	SearchUsersByFeatureSoapResponse
} from '../../../../types/network/soap/searchUsersByFeatureRequest';
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
	const showMoreUsersLabel = t('participantsList.creationList.loadMore', 'Show more users');

	const [filteredGal, setFilteredGal] = useState<ContactInfo[]>([]);
	const [requestStatus, setRequestStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [hasMore, setHasMore] = useState<boolean>(false);

	const singleConversationsUserId = useStore(getSingleConversationsUserId);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const searchOnGal = useCallback(
		debounce((text: string) => {
			if (text !== '') {
				setRequestStatus('loading');
				setHasMore(false);
				searchUsersByFeatureRequest(text)
					.then(({ contacts, more }: SearchUsersByFeatureSoapResponse) => {
						setRequestStatus('success');
						setFilteredGal(contacts);
						setHasMore(more);
					})
					.catch(() => {
						setRequestStatus('error');
						setHasMore(false);
					});
			}
		}, 500),
		[]
	);

	const loadMoreContacts = useCallback(() => {
		setHasMore(false);
		searchUsersByFeatureRequest(input ?? '', filteredGal.length)
			.then(({ contacts, more }: SearchUsersByFeatureSoapResponse) => {
				setFilteredGal((prevResults) => union(prevResults, contacts));
				setHasMore(more);
			})
			.catch(() => {
				setHasMore(true);
			});
	}, [filteredGal.length, input]);

	useEffect(() => {
		searchOnGal(input);
	}, [input, searchOnGal]);

	const GalSearchHeader = useMemo(() => {
		if (expanded) {
			return (
				<Padding horizontal="large" vertical="large" bottom="small">
					<CustomText size="small" color="primary">
						{createNewChatLabel}
					</CustomText>
				</Padding>
			);
		}
		return undefined;
	}, [expanded, createNewChatLabel]);

	const GalUsersComponent = useMemo(() => {
		const filteredGalWithUserId = differenceWith(
			filteredGal,
			singleConversationsUserId,
			(gal, userId) => gal.id === userId
		);
		const users = map(filteredGalWithUserId, (contactInfo) => (
			<GalListItem contact={contactInfo} expanded={expanded} key={contactInfo.id} />
		));
		if (hasMore) {
			users.push(
				<Container width="fill" height="fit" padding="0.5rem" key="load-more">
					{expanded ? (
						<Button
							label={showMoreUsersLabel}
							type="ghost"
							size="small"
							onClick={loadMoreContacts}
						/>
					) : (
						<Tooltip label={showMoreUsersLabel}>
							<Button icon="Plus" onClick={loadMoreContacts} type="outlined" labelColor="primary" />
						</Tooltip>
					)}
				</Container>
			);
		}
		return users;
	}, [
		expanded,
		filteredGal,
		hasMore,
		loadMoreContacts,
		showMoreUsersLabel,
		singleConversationsUserId
	]);

	const PendingComponent = useMemo(
		() => (
			<CustomContainer padding={{ vertical: 'small', horizontal: 'large' }} height="fit">
				<Spinner color="primary" />
			</CustomContainer>
		),
		[]
	);

	const ErrorComponent = useMemo(
		() => (
			<CustomContainer
				padding={{ vertical: 'small', horizontal: expanded ? 'large' : 'small' }}
				height="fit"
				gap="1rem"
			>
				{expanded ? (
					<>
						<SecondaryBarInfoText color="gray1" size="small" weight="light" overflow="break-word">
							{errorLabel}
						</SecondaryBarInfoText>
						<CustomButton color="gray1" onClick={() => searchOnGal(input)} label={retryLabel} />
					</>
				) : (
					<Tooltip label={retryLabel}>
						<Button color="gray1" icon="Refresh" onClick={() => searchOnGal(input)} />
					</Tooltip>
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
