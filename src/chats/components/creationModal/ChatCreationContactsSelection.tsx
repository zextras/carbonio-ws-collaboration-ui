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
	ListItem,
	ListV2,
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
	size,
	union
} from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ListParticipant from './ListParticipant';
import { searchUsersByFeatureRequest } from '../../../network/soap/SearchUsersByFeatureRequest';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import {
	ContactInfo,
	SearchUsersByFeatureSoapResponse
} from '../../../types/network/soap/searchUsersByFeatureRequest';
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
	const noMatchLabel = t(
		'participantsList.noMatch.gal',
		'There are no items that match this search in your company.'
	);
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
		() => (typeof maxMembers === 'number' ? maxMembers - 1 : undefined),
		[maxMembers]
	);

	const membersToAdd = useMemo(() => {
		if (typeof maxGroupMembers === 'number' && maxGroupMembers - size(contactsSelected) !== 0) {
			if (isCreationModal) return maxGroupMembers - size(contactsSelected);
			if (maxGroupMembers - (size(members) - 1) - size(contactsSelected) !== 0) {
				return maxGroupMembers - (size(members) - 1) - size(contactsSelected);
			}
		}
		return -1;
	}, [contactsSelected, isCreationModal, maxGroupMembers, members]);

	const addUsersLimit = t('modal.creation.addUserLimit.users', {
		defaultValue:
			maxGroupMembers && membersToAdd > 1
				? `You can add other ${membersToAdd} members`
				: 'You can add one last member',
		count: maxGroupMembers ? membersToAdd : 0
	});

	const [result, setResult] = useState<ContactInfo[]>([]);
	const [chips, setChips] = useState<ChipItem<ContactInfo>[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<boolean>(false);

	// Callback that creates the users' list when you are already inside a group
	const userListNotInsideRoom = useCallback(
		(response: SearchUsersByFeatureSoapResponse) => {
			const userList: ContactInfo[] = [];
			const membersIds = map(members, 'userId');
			forEach(response, (user) => {
				if (!includes(membersIds, user.id)) {
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
		searchUsersByFeatureRequest('')
			.then((response: SearchUsersByFeatureSoapResponse) => {
				setLoading(false);
				if (isCreationModal) {
					setResult(response);
				} else {
					const usersNotInsideRoom = userListNotInsideRoom(response);
					setResult(usersNotInsideRoom);
				}
			})
			.catch(() => {
				setLoading(false);
			});
	}, [isCreationModal, userListNotInsideRoom]);

	const debouncedAutoComplete = useMemo(
		() =>
			debounce(() => {
				searchUsersByFeatureRequest(inputRef.current?.value ?? '')
					.then((response: SearchUsersByFeatureSoapResponse) => {
						setLoading(false);
						if (isCreationModal) {
							setResult(response);
							if (size(response) === 0) setError(true);
						} else {
							const usersNotInsideRoom = userListNotInsideRoom(response);
							setResult(usersNotInsideRoom);
							if (size(usersNotInsideRoom) === 0) setError(true);
						}
					})
					.catch(() => {
						setLoading(false);
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

	const chipInputHasError = useMemo(
		() =>
			isCreationModal
				? typeof maxGroupMembers === 'number' && maxGroupMembers <= size(contactsSelected)
				: typeof maxGroupMembers === 'number' &&
					maxGroupMembers - (size(members) - 1) <= size(contactsSelected),
		[isCreationModal, contactsSelected, maxGroupMembers, members]
	);

	const addOrRemoveChip = useCallback((newChip) => {
		setChips((chips) =>
			find(chips, (chip) => chip.value?.id === newChip.value?.id)
				? differenceBy(chips, [newChip], (chip) => chip.value?.id)
				: union(chips, [newChip])
		);
	}, []);

	const onClickListItem = useCallback(
		(item: ContactInfo) => (): void => {
			if ((chipInputHasError && !!contactsSelected[item.id]) || !chipInputHasError) {
				const newChip: ChipItem<ContactInfo> = {
					value: item,
					label: item.displayName || item.email
				};
				setContactSelected((contacts: ContactSelected) =>
					contacts[item.id] ? omit(contacts, item.id) : { ...contacts, [item.id]: item }
				);
				addOrRemoveChip(newChip);
			}
		},
		[addOrRemoveChip, chipInputHasError, contactsSelected, setContactSelected]
	);

	const items = useMemo(
		() =>
			map(result, (item) => (
				<ListItem key={item.id} active={!!contactsSelected[item.id]}>
					{() => (
						<ListParticipant
							item={item}
							selected={!!contactsSelected[item.id]}
							onClickCb={onClickListItem}
							isDisabled={chipInputHasError}
						/>
					)}
				</ListItem>
			)),
		[chipInputHasError, contactsSelected, onClickListItem, result]
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
			return <ListV2 data-testid="list_creation_modal">{items}</ListV2>;
		}
		return (
			<CustomContainer padding="large">
				<Text color="gray1" size="small" weight="light">
					{noMatchLabel}
				</Text>
			</CustomContainer>
		);
	}, [error, items, loading, noMatchLabel]);

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

export type ContactSelected = {
	[id: string]: ContactInfo;
};
