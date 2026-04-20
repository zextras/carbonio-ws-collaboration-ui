/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable jsx-a11y/no-autofocus */
import React, { FC, useCallback, useState, useMemo, useEffect } from 'react';

import {
	Button,
	Container,
	Icon,
	Input,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTracker } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import SearchResultMessage from './SearchResultMessage';
import { CHATS_APP_ID, TRACKER_EVENT } from '../../../constants/appConstants';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import { xmppClient } from '../../../network/xmpp/XMPPClient';
import { getRoomNameSelector, getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';

enum RequestStatus {
	IDLE = 'idle',
	LOADING = 'loading',
	SUCCESS = 'success'
}

type ConversationSearchPanelProps = {
	roomId: string;
	goToChatView: () => void;
};

const ConversationSearchPanel: FC<ConversationSearchPanelProps> = ({ roomId, goToChatView }) => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const roomType = useStore((state) => getRoomTypeSelector(state, roomId));
	const { capture } = useTracker();
	const isDesktopView = useMediaQueryCheck();

	const createSnackbar = useSnackbar();

	const [t] = useTranslation();
	const inputLabel = t('searchPanel.inputPlaceholder', 'Search messages');
	const searchMessagesInLabel = t(
		'searchPanel.groupPlaceholder',
		'Search messages in {{roomName}}',
		{ roomName }
	);
	const searchMessagesWithLabel = t(
		'searchPanel.singlePlaceholder',
		'Search messages with {{personName}}',
		{
			personName: roomName
		}
	);
	const searchingLabel = t('searchPanel.searching', 'Searching...');
	const noResults1Label = t('searchPanel.noResults', 'It looks like there are no results.');
	const noResults2Label = t('searchPanel.keepSearching', 'Keep searching!');
	const messagesTooltip = t('conversationInfo.messages', 'Messages');
	const clearSearchTooltip = t('searchPanel.clearTooltip', 'Clear search');
	const errorSnackbarLabel = t(
		'searchPanel.errorSnackbar',
		'Something went wrong with the search. Please try again.'
	);

	const [requestStatus, setRequestStatus] = useState<RequestStatus>(RequestStatus.IDLE);
	const [searchText, setSearchText] = useState<string>('');
	const [activeSearchText, setActiveSearchText] = useState<string>('');

	const results = useStore((state) => state.chatsRegistry[roomId]?.searchResults);
	const clearSearchResults = useStore((state) => state.clearSearchResults);

	useEffect(
		() => () => {
			clearSearchResults(roomId);
		},
		[clearSearchResults, roomId]
	);

	const search = useCallback(() => {
		if (!searchText || requestStatus === RequestStatus.LOADING) return;
		setRequestStatus(RequestStatus.LOADING);
		setActiveSearchText(searchText);
		capture(TRACKER_EVENT.conversationSearch, {
			app: CHATS_APP_ID,
			roomType,
			searchTextLength: searchText.length
		});
		xmppClient
			.fullTextSearch(roomId, searchText)
			.then(() => {
				setRequestStatus(RequestStatus.SUCCESS);
			})
			.catch(() => {
				setRequestStatus(RequestStatus.IDLE);
				capture(TRACKER_EVENT.conversationSearchError, {
					app: CHATS_APP_ID,
					roomType,
					success: false
				});
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'error',
					label: errorSnackbarLabel
				});
			});
	}, [capture, createSnackbar, errorSnackbarLabel, requestStatus, roomId, roomType, searchText]);

	const searchResults = useMemo(
		() =>
			results?.map((message) => (
				<SearchResultMessage key={message.id} message={message} searchText={activeSearchText} />
			)),
		[activeSearchText, results]
	);

	const resultsComponents = useMemo(() => {
		switch (requestStatus) {
			case RequestStatus.IDLE:
				return (
					<>
						<Container orientation="horizontal" height="fit" gap="0.5rem">
							<Icon icon="Search" color="secondary" size="large" />
							<Icon icon="MessageCircleOutline" color="secondary" size="large" />
						</Container>
						<Text
							weight="bold"
							color="secondary"
							size="large"
							overflow="break-word"
							textAlign="center"
						>
							{roomType === RoomType.ONE_TO_ONE ? searchMessagesWithLabel : searchMessagesInLabel}
						</Text>
					</>
				);
			case RequestStatus.LOADING:
				return (
					<>
						<Icon icon="LoaderOutline" color="secondary" size="large" />
						<Text weight="bold" color="secondary" size="large">
							{searchingLabel}
						</Text>
					</>
				);
			case RequestStatus.SUCCESS:
				if (results && results.length > 0) {
					return (
						<Container mainAlignment="flex-start" gap="0.5rem">
							{searchResults}
						</Container>
					);
				}
				return (
					<>
						<Text
							color="secondary"
							size="large"
							lineHeight={1}
							overflow="break-word"
							textAlign="center"
						>
							{noResults1Label}
						</Text>
						<Text color="secondary" size="large" overflow="break-word" textAlign="center">
							{noResults2Label}
						</Text>
					</>
				);
			default:
				return null;
		}
	}, [
		noResults1Label,
		noResults2Label,
		requestStatus,
		results,
		roomType,
		searchMessagesInLabel,
		searchMessagesWithLabel,
		searchResults,
		searchingLabel
	]);

	const isSearchDisabled = useMemo(
		() => !searchText.trim() || requestStatus === RequestStatus.LOADING,
		[requestStatus, searchText]
	);

	return (
		<Container>
			<Container
				background="gray5"
				height="3rem"
				orientation="horizontal"
				padding={{ vertical: 'small', right: 'small' }}
				gap="0.25rem"
			>
				<Input
					label={inputLabel}
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					onEnter={isSearchDisabled ? undefined : search}
					autoFocus
					height="3rem"
				/>
				{searchText && (
					<Tooltip label={clearSearchTooltip}>
						<Button
							type="ghost"
							size="large"
							minWidth="large"
							icon="BackspaceOutline"
							color="gray0"
							onClick={() => {
								setSearchText('');
								setRequestStatus(RequestStatus.IDLE);
								clearSearchResults(roomId);
							}}
						/>
					</Tooltip>
				)}
				<Button
					type="ghost"
					size="large"
					minWidth="large"
					color="gray0"
					onClick={search}
					icon="Search"
					disabled={isSearchDisabled}
				/>
				{!isDesktopView && (
					<Tooltip label={messagesTooltip}>
						<Button
							type="ghost"
							onClick={goToChatView}
							color="gray0"
							size="large"
							minWidth="large"
							icon="MessageCircleOutline"
						/>
					</Tooltip>
				)}
			</Container>
			<Container padding="small" gap="0.5rem" width="fill" style={{ overflowY: 'auto' }}>
				{resultsComponents}
			</Container>
		</Container>
	);
};

export default ConversationSearchPanel;
