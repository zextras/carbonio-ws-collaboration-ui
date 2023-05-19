/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	ChipInput,
	Padding,
	Text,
	Row,
	Avatar,
	List,
	Container,
	Checkbox
} from '@zextras/carbonio-design-system';
import { Spinner } from '@zextras/carbonio-shell-ui';
import {
	debounce,
	difference,
	differenceBy,
	find,
	forEach,
	includes,
	map,
	omit,
	remove,
	size,
	union
} from 'lodash';
import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
	autoCompleteGalRequest,
	AutoCompleteGalResponse,
	ContactMatch
} from '../../../network/soap/AutoCompleteRequest';
import useStore from '../../../store/Store';
import { Member } from '../../../types/store/RoomTypes';

const CustomContainer = styled(Container)`
	cursor: default;
`;

type ChatCreationContactsSelectionProps = {
	contactsSelected: ContactSelected;
	setContactSelected: Dispatch<SetStateAction<ContactSelected>>;
	isCreationModal?: boolean;
	members?: Member[] | undefined;
};

const ChatCreationContactsSelection = ({
	contactsSelected,
	setContactSelected,
	isCreationModal,
	members
}: ChatCreationContactsSelectionProps): ReactElement => {
	const [t] = useTranslation();
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');
	const inputPlaceholder = t('modal.creation.inputPlaceholder', 'Start typing or pick an address');
	const listTextLabel = t(
		'modal.creation.contactList',
		'Select more than an address to create a Group'
	);

	const inputRef = useRef<HTMLInputElement>(null);
	const [result, setResult] = useState<ContactMatch[]>([]);
	const [chips, setChips] = useState<ChipInfo[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<boolean>(false);

	// Callback that creates the users' list when you are already inside a group
	const userListNotInsideRoom = useCallback(
		(response) => {
			const userList: ContactMatch[] = [];
			const membersIds = map(members, 'userId');
			forEach(response, (user) => {
				if (!includes(membersIds, user.zimbraId)) {
					userList.push(user);
				}
			});
			return userList;
		},
		[members]
	);

	// Start with a full zimbra contacts list
	useEffect(() => {
		setLoading(true);
		setError(false);
		autoCompleteGalRequest('')
			.then((response: AutoCompleteGalResponse) => {
				setLoading(false);
				// Remove myself from the list
				remove(response, (user) => user.zimbraId === useStore.getState().session.id);
				if (isCreationModal) {
					setResult(response);
				} else {
					const usersNotInsideRoom: ContactMatch[] = userListNotInsideRoom(response);
					setResult(usersNotInsideRoom);
				}
			})
			.catch((err: Error) => {
				setLoading(false);
				console.error(err);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const debouncedAutoComplete = useMemo(
		() =>
			debounce(() => {
				autoCompleteGalRequest(inputRef.current?.value || '')
					.then((response: AutoCompleteGalResponse) => {
						setLoading(false);
						// Remove myself from the list
						remove(response, (user) => user.zimbraId === useStore.getState().session.id);
						if (isCreationModal) {
							setResult(response);
							if (size(response) === 0) setError(true);
						} else {
							const usersNotInsideRoom: ContactMatch[] = userListNotInsideRoom(response);
							setResult(usersNotInsideRoom);
							if (size(usersNotInsideRoom) === 0) setError(true);
						}
					})
					.catch((err: Error) => {
						setLoading(false);
						console.error(err);
					});
			}, 200),
		[isCreationModal, userListNotInsideRoom]
	);

	// Search zimbra contacts on typing
	const handleChangeText = useCallback(() => {
		setLoading(true);
		setError(false);
		debouncedAutoComplete();
	}, [debouncedAutoComplete]);

	const resultList = useMemo(
		() =>
			map(result, (user: ContactMatch) => ({
				id: user.zimbraId,
				name: user.fullName,
				email: user.email
			})),
		[result]
	);

	const onClickListItem = useCallback(
		(item: ContactInfo) => () => {
			const newChip: ChipInfo = {
				id: item.id,
				label: item.name,
				value: item
			};
			setContactSelected((contacts: ContactSelected) =>
				contacts[item.id] ? omit(contacts, item.id) : { ...contacts, [item.id]: item }
			);
			setChips((chips) =>
				find(chips, (chip) => chip.id === item.id)
					? differenceBy(chips, [newChip], 'id')
					: union(chips, [newChip])
			);
			if (inputRef.current) {
				inputRef.current.value = '';
			}
		},
		[setContactSelected]
	);

	const ListItem = useMemo(
		() =>
			// eslint-disable-next-line react/display-name
			({ item, selected }: { item: ContactInfo; selected: boolean }) =>
				(
					<Padding vertical="small">
						<Container
							onClick={onClickListItem(item)}
							orientation="horizontal"
							mainAlignment="flex-start"
							width="fill"
						>
							<Row>
								<Checkbox value={selected} />
								<Padding horizontal="small">
									<Avatar label={item.name} />
								</Padding>
								<Container crossAlignment="flex-start" width="fit">
									<Text size="small">{item.name}</Text>
									<Padding top="extrasmall" />
									<Text size="extrasmall" color="gray1">
										{item.email}
									</Text>
								</Container>
							</Row>
						</Container>
					</Padding>
				),
		// eslint-disable-next-line
		[]
	);

	const removeContactFromChip = useCallback(
		(newChips) => {
			const differenceChip = difference(chips, newChips)[0];
			if (size(chips) > size(newChips) && differenceChip) {
				setContactSelected((contacts: ContactSelected) => omit(contacts, differenceChip.id));
				setChips((chips) => differenceBy(chips, [differenceChip], 'id'));
			}
		},
		[chips, setContactSelected]
	);

	return (
		<>
			<ChipInput
				background={'gray5'}
				inputRef={inputRef}
				placeholder={inputPlaceholder}
				onInputType={handleChangeText}
				value={chips}
				onChange={removeContactFromChip}
				requireUniqueChips
				maxChips={15} // TODO
				data-testid="chip_input_creation_modal"
				confirmChipOnBlur={false}
				confirmChipOnSpace={false}
				separators={['']}
			/>
			<Padding bottom="large" />
			<Container height="9.375rem">
				{loading ? (
					<Spinner />
				) : !error ? (
					<List
						data-testid="list_creation_modal"
						items={resultList}
						ItemComponent={ListItem}
						selected={contactsSelected}
					/>
				) : (
					<CustomContainer padding="large">
						<Text color="gray1" size="small" weight="light">
							{noMatchLabel}
						</Text>
					</CustomContainer>
				)}
			</Container>
			<Padding bottom="large" />
			<Text color="gray1">{isCreationModal && listTextLabel}</Text>
		</>
	);
};

export default ChatCreationContactsSelection;

export type ContactInfo = {
	id: string;
	name: string;
	email: string;
};

export type ChipInfo = {
	id: string;
	label: string;
	value: ContactInfo;
};

export type ContactSelected = {
	[id: string]: ContactInfo;
};
