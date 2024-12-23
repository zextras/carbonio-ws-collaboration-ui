/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
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
	useRef,
	useState
} from 'react';

import {
	ChipAction,
	ChipInput,
	ChipItem,
	Container,
	List,
	ListItem,
	Padding,
	Spinner,
	Text
} from '@zextras/carbonio-design-system';
import { difference, differenceBy, filter, find, map, size, union } from 'lodash';
import { useTranslation } from 'react-i18next';

import ListParticipant from './creationModal/ListParticipant';
import { searchUsersByFeatureRequest } from '../../network/soap/SearchUsersByFeatureRequest';
import {
	ContactInfo,
	SearchUsersByFeatureSoapResponse
} from '../../types/network/soap/searchUsersByFeatureRequest';
import { Member } from '../../types/store/RoomTypes';

type ContactsSelectorProps = {
	contactsSelected: ContactsSelected;
	setContactSelected: Dispatch<SetStateAction<ContactsSelected>>;
	canSelectOwnership?: boolean;
	maxSelectionNumber?: number;
	currentMembers?: Member[];
	chipInputPlaceholder?: string;
};

const ContactsSelector = ({
	contactsSelected,
	setContactSelected,
	canSelectOwnership = false,
	maxSelectionNumber,
	currentMembers = [],
	chipInputPlaceholder
}: ContactsSelectorProps): ReactElement => {
	const [t] = useTranslation();
	const inputPlaceholder = t('modal.creation.inputPlaceholder', 'Start typing or pick an address');
	const addUserLimitReachedLabel = t(
		'modal.creation.addUserLimit.limitReached',
		'You have selected the maximum number of members for a group'
	);
	const noMatchLabel = t(
		'participantsList.noMatch.gal',
		'There are no items that match this search in your company.'
	);
	const demoteModeratorLabel = t('tooltip.demoteModerator', 'Demote moderator');
	const promoteModeratorLabel = t('tooltip.promoteModerator', 'Promote to moderator');

	const [searchResult, setSearchResult] = useState<ContactInfo[]>([]);
	const [chips, setChips] = useState<ChipItem<ContactInfo>[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const chipInputError = useMemo(
		() => !!(maxSelectionNumber && maxSelectionNumber <= size(contactsSelected)),
		[contactsSelected, maxSelectionNumber]
	);

	const resultsError = useMemo(() => size(searchResult) === 0 && !loading, [searchResult, loading]);

	const updateOwnership = useCallback(
		(id: string) => {
			setContactSelected((contacts) =>
				map(contacts, (contact) => {
					if (contact.id === id) {
						return { ...contact, owner: !contact.owner };
					}
					return contact;
				})
			);
		},
		[setContactSelected]
	);

	const inputDescription = useMemo(() => {
		if (!maxSelectionNumber) return undefined;
		const placesLeft = maxSelectionNumber - size(contactsSelected);
		if (placesLeft > 0)
			return t('modal.creation.addUserLimit.users', {
				defaultValue:
					placesLeft >= 2
						? `You can add other ${placesLeft} members`
						: 'You can add one last member',
				count: placesLeft
			});
		return addUserLimitReachedLabel;
	}, [contactsSelected, maxSelectionNumber, t, addUserLimitReachedLabel]);

	useEffect(() => {
		const newChips = map(contactsSelected, (contact) => {
			const actions: ChipAction[] = [];
			if (canSelectOwnership) {
				actions.push({
					id: 'set-moderator',
					type: 'button',
					label: contact.owner ? demoteModeratorLabel : promoteModeratorLabel,
					icon: contact.owner ? 'Crown' : 'CrownOutline',
					onClick: (): void => updateOwnership(contact.id)
				});
			}
			return {
				value: contact,
				label: contact.displayName || contact.email,
				actions
			};
		});
		setChips(newChips);
	}, [
		canSelectOwnership,
		contactsSelected,
		demoteModeratorLabel,
		promoteModeratorLabel,
		updateOwnership
	]);

	const filterResponse = useCallback(
		(response: SearchUsersByFeatureSoapResponse) =>
			filter(
				response,
				(contact) => !find(currentMembers, (member) => member.userId === contact.id)
			),
		[currentMembers]
	);

	const searchContacts = useCallback(() => {
		setLoading(true);
		searchUsersByFeatureRequest(inputRef.current?.value ?? '')
			.then((response: SearchUsersByFeatureSoapResponse) => {
				setLoading(false);
				setSearchResult(filterResponse(response));
			})
			.catch(() => {
				setLoading(false);
			});
	}, [filterResponse]);

	useEffect(
		() => searchContacts(),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const onClickListedContact = useCallback(
		(contact: ContactInfo) => (): void => {
			const alreadySelected = find(contactsSelected, { id: contact.id });
			if (!chipInputError || !!alreadySelected) {
				if (alreadySelected) {
					setContactSelected((contacts) => differenceBy(contacts, [contact], 'id'));
				} else {
					setContactSelected((contacts) => union(contacts, [contact]));
				}
				if (inputRef.current) {
					inputRef.current.value = '';
				}
			}
		},
		[chipInputError, contactsSelected, setContactSelected]
	);

	const onChipRemove = useCallback(
		(newChips: ChipItem<ContactInfo>[]) => {
			const differenceChipId = difference(chips, newChips)[0]?.value?.id;
			if (differenceChipId && size(chips) > size(newChips)) {
				setContactSelected((contacts) => differenceBy(contacts, [{ id: differenceChipId }], 'id'));
			}
		},
		[chips, setContactSelected]
	);

	const items = useMemo(
		() =>
			map(searchResult, (item) => {
				const contactSelected = find(contactsSelected, { id: item.id });
				return (
					<ListItem key={item.id} active={!!contactSelected}>
						{() => (
							<ListParticipant
								item={item}
								selected={!!contactSelected}
								onClickCb={onClickListedContact}
								isDisabled={chipInputError}
								updateOwner={updateOwnership} // change prop name
								isOwner={() => contactSelected?.owner || false} // do not pass function
								canBeModerator={canSelectOwnership}
							/>
						)}
					</ListItem>
				);
			}),
		[
			canSelectOwnership,
			chipInputError,
			contactsSelected,
			onClickListedContact,
			searchResult,
			updateOwnership
		]
	);

	const ListContacts = useMemo(() => {
		if (loading) return <Spinner color="primary" />;
		if (!resultsError) return <List data-testid="list_contacts">{items}</List>;
		return (
			<Text color="gray1" size="small" weight="light">
				{noMatchLabel}
			</Text>
		);
	}, [resultsError, items, loading, noMatchLabel]);

	return (
		<Container>
			<ChipInput
				ref={inputRef}
				data-testid="chip_input_contact_selector"
				placeholder={inputPlaceholder}
				description={chipInputPlaceholder ?? inputDescription ?? ''}
				inputRef={inputRef}
				onInputType={searchContacts}
				value={chips}
				onChange={onChipRemove}
				maxChips={maxSelectionNumber}
				confirmChipOnBlur={false}
				requireUniqueChips
				separators={[]}
			/>
			{inputDescription && <Padding bottom="small" />}
			<Container height="9.375rem">{ListContacts}</Container>
		</Container>
	);
};

export default ContactsSelector;

export type ContactsSelected = (ContactInfo & { owner?: boolean })[];
