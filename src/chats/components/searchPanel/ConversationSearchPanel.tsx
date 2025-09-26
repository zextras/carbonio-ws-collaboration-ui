/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useState, useMemo, useEffect } from 'react';

import { Button, Container, Icon, Input, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import SearchResultMessage from './SearchResultMessage';
import { getRoomNameSelector, getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';

enum RequestStatus {
	IDLE = 'idle',
	LOADING = 'loading',
	ERROR = 'error',
	SUCCESS = 'success'
}

type ConversationSearchPanelProps = {
	roomId: string;
	toggleSearchPanel: () => void;
};

const ConversationSearchPanel: FC<ConversationSearchPanelProps> = ({
	roomId,
	toggleSearchPanel
}) => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const roomType = useStore((state) => getRoomTypeSelector(state, roomId));

	// TODO translation keys
	const [t] = useTranslation();
	const inputLabel = t('', 'Search messages');
	const searchMessagesInLabel = t('', 'Search messages in {{roomName}}', { roomName });
	const searchMessagesWithLabel = t('', 'Search messages with {{personName}}', {
		personName: roomName
	});
	const searchingLabel = t('', 'Searching...');
	const error1Label = t('', 'An error occurred while searching messages.');
	const error2Label = t('', 'Please try again.');
	const noResults1Label = t('', 'It looks like there are no results.');
	const noResults2Label = t('', 'Keep searching!');

	const [requestStatus, setRequestStatus] = useState<RequestStatus>(RequestStatus.IDLE);
	const [searchText, setSearchText] = useState<string>('');

	const results = useStore((state) => state.chatsRegistry[roomId]?.searchResults);

	const search = useCallback(() => {
		if (!searchText || requestStatus === RequestStatus.LOADING) return;
		setRequestStatus(RequestStatus.LOADING);
		const { xmppClient } = useStore.getState().connections;
		xmppClient
			.fullTextSearch(roomId, searchText)
			.then(() => {
				setRequestStatus(RequestStatus.SUCCESS);
			})
			.catch(() => {
				setRequestStatus(RequestStatus.ERROR);
			});
	}, [requestStatus, roomId, searchText]);

	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent): void => {
			if (event.key === 'Enter') search();
		};
		window.addEventListener('keydown', handleKeyPress);
		return (): void => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [search]);

	const searchResults = useMemo(
		() => results?.map((message) => <SearchResultMessage key={message.id} message={message} />),
		[results]
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
			case RequestStatus.ERROR:
				return (
					<>
						<Icon icon="CloseCircleOutline" color="secondary" size="large" />
						<Text
							weight="bold"
							color="secondary"
							size="large"
							overflow="break-word"
							textAlign="center"
						>
							{error1Label}
						</Text>
						<Text
							weight="bold"
							color="secondary"
							size="large"
							overflow="break-word"
							textAlign="center"
						>
							{error2Label}
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
		error1Label,
		error2Label,
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

	const cancelIcon = useMemo(
		() =>
			function icon(): React.JSX.Element | undefined {
				if (searchText) {
					return (
						<Button
							type="ghost"
							icon="Close"
							color="secondary"
							onClick={() => {
								setSearchText('');
								setRequestStatus(RequestStatus.IDLE);
							}}
						/>
					);
				}
				return undefined;
			},
		[searchText]
	);

	return (
		<Container>
			<Container
				background="gray5"
				height="3rem"
				orientation="horizontal"
				padding={{ horizontal: 'medium', vertical: 'small' }}
				gap="0.5rem"
			>
				{/* TODO: add key translation */}
				<Tooltip label={t('', 'Close search')} placement={'top'}>
					<Button
						type="ghost"
						size="large"
						color="secondary"
						onClick={toggleSearchPanel}
						icon="ArrowBack"
					/>
				</Tooltip>
				<Input
					label={inputLabel}
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					CustomIcon={cancelIcon}
				/>
				<Button
					type="ghost"
					size="large"
					color="secondary"
					onClick={search}
					icon="Search"
					disabled={!searchText || requestStatus === RequestStatus.LOADING}
				/>
			</Container>
			<Container padding="small" gap="0.5rem" width="fill" style={{ overflow: 'scroll' }}>
				{resultsComponents}
			</Container>
		</Container>
	);
};

export default ConversationSearchPanel;
