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
import { debounce, difference, differenceBy, find, includes, map, omit, size, union } from 'lodash';
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
} from '../../network/soap/AutoCompleteRequest';
import { Member } from '../../types/store/RoomTypes';

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
		'Select more that an address to create a group chat'
	);

	const inputRef = useRef<HTMLInputElement>(null);
	const [result, setResult] = useState<ContactMatch[]>([]);
	const [chips, setChips] = useState<ChipInfo[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<boolean>(false);

	// Callback that creates the users'list when you are already inside a group
	const userListNotInsideRoom = useCallback(
		(response) => {
			const userList: ContactMatch[] = [];
			const membersIds = map(members, 'userId');
			// eslint-disable-next-line no-restricted-syntax
			for (const user of response) {
				if (!includes(membersIds, user.zimbraId)) {
					userList.push(user);
				}
			}
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

	// Search zimbra contacts on typing
	const handleChangeText = useCallback(
		(ev) => {
			setLoading(true);
			setError(false);
			debounce(() => {
				autoCompleteGalRequest(ev.textContent)
					.then((response: AutoCompleteGalResponse) => {
						setLoading(false);
						if (isCreationModal) {
							setResult(response);
							if (size(response) === 0) setError(true);
						} else {
							const usersNotInsideRoom: ContactMatch[] = userListNotInsideRoom(response);
							setResult(usersNotInsideRoom);
							if (size(response) === 0) setError(true);
						}
					})
					.catch((err: Error) => {
						setLoading(false);
						console.error(err);
					});
			}, 200)();
		},
		[isCreationModal, userListNotInsideRoom]
	);

	const resultList = useMemo(
		() =>
			map(result, (user: ContactMatch) => ({
				id: user.zimbraId,
				name: user.fullName,
				email: user.fullName
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
			({ item, selected }: any) =>
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
								<Text>{item.name}</Text>
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
				setContactSelected((contacts: any) => omit(contacts, differenceChip.id));
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
			<Text size="small" color="gray1">
				{isCreationModal && listTextLabel}
			</Text>
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
