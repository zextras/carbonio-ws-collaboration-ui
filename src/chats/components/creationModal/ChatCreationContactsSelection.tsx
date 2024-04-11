/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';

import {
	ChipInput,
	ChipItem,
	Container,
	List,
	Padding,
	Text
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
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ListParticipant from './ListParticipant';
import {
	autoCompleteGalRequest,
	AutoCompleteGalResponse,
	ContactMatch
} from '../../../network/soap/AutoCompleteRequest';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { Member } from '../../../types/store/RoomTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';

const CustomContainer = styled(Container)`
	cursor: default;
`;

type ChatCreationContactsSelectionProps = {
	contactsSelected: ContactSelected;
	setContactSelected: Dispatch<SetStateAction<ContactSelected>>;
	isCreationModal?: boolean;
	members?: Member[];
	inputRef: React.RefObject<HTMLInputElement>;
};

const ChatCreationContactsSelection = ({
	contactsSelected,
	setContactSelected,
	isCreationModal,
	members,
	inputRef
}: ChatCreationContactsSelectionProps): ReactElement => {
	const [t] = useTranslation();
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');
	const inputPlaceholder = t('modal.creation.inputPlaceholder', 'Start typing or pick an address');
	const listTextLabel = t(
		'modal.creation.contactList',
		'Select more than an address to create a Group'
	);
	const addUserLimitReachedLabel = t(
		'modal.creation.addUserLimit.limitReached',
		'You have selected the maximum number of members for a group'
	);

	const maxMembers = useStore((store) => getCapability(store, CapabilityType.MAX_GROUP_MEMBERS));

	const maxGroupMembers = useMemo(
		() => (isCreationModal && typeof maxMembers === 'number' ? maxMembers - 1 : undefined),
		[isCreationModal, maxMembers]
	);

	const membersToAdd = useMemo(() => {
		if (typeof maxGroupMembers === 'number' && maxGroupMembers - size(contactsSelected) !== 0) {
			if (isCreationModal) return maxGroupMembers - size(contactsSelected);
			if (maxGroupMembers - size(members) - size(contactsSelected) !== 0) {
				return maxGroupMembers - size(members) - size(contactsSelected);
			}
		}
		return -1;
	}, [contactsSelected, isCreationModal, maxGroupMembers, members]);

	const addUsersLimit = t(
		'modal.creation.addUserLimit.users',
		'You can invite other {{count}} members',
		{
			count: maxGroupMembers ? membersToAdd : 0
		}
	);

	const [result, setResult] = useState<ContactMatch[]>([]);
	const [chips, setChips] = useState<ChipItem<ContactInfo>[]>([]);
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

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, [inputRef]);

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
				autoCompleteGalRequest(inputRef.current?.value ?? '')
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
		[inputRef, isCreationModal, userListNotInsideRoom]
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
			const newChip: ChipItem<ContactInfo> = {
				value: item,
				label: item.name || item.email
			};
			setContactSelected((contacts: ContactSelected) =>
				contacts[item.id] ? omit(contacts, item.id) : { ...contacts, [item.id]: item }
			);
			setChips((chips) =>
				find(chips, (chip) => chip.value?.id === item.id)
					? differenceBy(chips, [newChip], (chip) => chip.value?.id)
					: union(chips, [newChip])
			);
		},
		[setContactSelected]
	);

	const chipInputHasError = useMemo(
		() =>
			isCreationModal
				? typeof maxGroupMembers === 'number' && maxGroupMembers <= size(contactsSelected)
				: typeof maxGroupMembers === 'number' &&
					maxGroupMembers - size(members) <= size(contactsSelected),
		[isCreationModal, contactsSelected, maxGroupMembers, members]
	);

	const ListItem = useMemo(
		() =>
			// eslint-disable-next-line react/display-name
			({ item, selected }: { item: ContactInfo; selected: boolean }) => {
				const clickCb =
					(chipInputHasError && selected) || !chipInputHasError
						? onClickListItem
						: () => () => null;
				return (
					<ListParticipant
						item={item}
						selected={selected}
						onClickCb={clickCb}
						isDisabled={chipInputHasError}
					/>
				);
			},
		[chipInputHasError, onClickListItem]
	);

	const removeContactFromChip = useCallback(
		(newChips: ChipItem<ContactInfo>[]) => {
			const differenceChip = difference(chips, newChips)[0];
			const differenceChipId = differenceChip.value?.id;
			if (size(chips) > size(newChips) && differenceChipId !== undefined) {
				setContactSelected((contacts: ContactSelected) => omit(contacts, differenceChipId));
				setChips((chips) => differenceBy(chips, [differenceChip], (chip) => chip.value?.id));
			}
		},
		[chips, setContactSelected]
	);

	const chipInputDescriptionLabel = useMemo(() => {
		if (membersToAdd !== -1) return addUsersLimit;
		return addUserLimitReachedLabel;
	}, [membersToAdd, addUsersLimit, addUserLimitReachedLabel]);

	const contentToDisplay = useMemo(() => {
		if (loading) {
			return <Spinner />;
		}
		if (!error) {
			return (
				<List
					data-testid="list_creation_modal"
					items={resultList}
					ItemComponent={ListItem}
					selected={contactsSelected}
				/>
			);
		}
		return (
			<CustomContainer padding="large">
				<Text color="gray1" size="small" weight="light">
					{noMatchLabel}
				</Text>
			</CustomContainer>
		);
	}, [ListItem, contactsSelected, error, loading, noMatchLabel, resultList]);

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
				maxChips={maxGroupMembers}
				data-testid="chip_input_creation_modal"
				confirmChipOnBlur={false}
				separators={[]}
				description={
					size(contactsSelected) > 1 || !isCreationModal ? chipInputDescriptionLabel : ''
				}
			/>
			{(size(contactsSelected) > 1 || !isCreationModal) && <Padding bottom="small" />}
			<Container height="9.375rem">{contentToDisplay}</Container>
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

export type ContactSelected = {
	[id: string]: ContactInfo;
};
