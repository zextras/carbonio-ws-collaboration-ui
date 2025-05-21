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
	Button,
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

import ListParticipant from './ListParticipant';
import { searchUsersByFeatureRequest } from '../../../network/soap/SearchUsersByFeatureRequest';
import {
	ContactInfo,
	SearchUsersByFeatureSoapResponse
} from '../../../types/network/soap/searchUsersByFeatureRequest';
import { Member } from '../../../types/store/RoomTypes';

type ContactsSelectorProps = {
	contactsSelected: ContactsSelected;
	setContactSelected: Dispatch<SetStateAction<ContactsSelected>>;
	canSelectOwnership?: boolean;
	maxSelectionNumber?: number;
	currentMembers?: Member[];
	chipInputPlaceholder?: string;
	customInputRef?: React.RefObject<HTMLInputElement>;
};

const ContactsSelector = ({
	contactsSelected,
	setContactSelected,
	canSelectOwnership = false,
	maxSelectionNumber,
	currentMembers = [],
	chipInputPlaceholder,
	customInputRef
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
	const showMoreUsersLabel = t('participantsList.creationList.loadMore', 'Show more users');

	const [searchResult, setSearchResult] = useState<ContactInfo[]>([]);
	const [chips, setChips] = useState<ChipItem<ContactInfo>[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [hasMore, setHasMore] = useState<boolean>(false);

	const chipInputRef = useRef<HTMLInputElement>(null);

	const inputRef = customInputRef ?? chipInputRef;

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
		(contacts: ContactInfo[]) =>
			filter(
				contacts,
				(contact) => !find(currentMembers, (member) => member.userId === contact.id)
			),
		[currentMembers]
	);

	const searchContacts = useCallback(() => {
		setLoading(true);
		setHasMore(false);
		searchUsersByFeatureRequest(inputRef.current?.value ?? '')
			.then(({ contacts, more }: SearchUsersByFeatureSoapResponse) => {
				setSearchResult(filterResponse(contacts));
				setLoading(false);
				setHasMore(more);
			})
			.catch(() => {
				setLoading(false);
				setHasMore(false);
			});
	}, [filterResponse, inputRef]);

	const loadMoreContacts = useCallback(() => {
		setHasMore(false);
		searchUsersByFeatureRequest(inputRef.current?.value ?? '', searchResult.length)
			.then(({ contacts, more }: SearchUsersByFeatureSoapResponse) => {
				setSearchResult((prevResults) => union(prevResults, filterResponse(contacts)));
				setHasMore(more);
			})
			.catch(() => {
				setHasMore(true);
			});
	}, [filterResponse, inputRef, searchResult]);

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
		[chipInputError, contactsSelected, inputRef, setContactSelected]
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

	const items = useMemo(() => {
		const Items = map(searchResult, (item) => {
			const contactSelected = find(contactsSelected, { id: item.id });
			return (
				<ListItem key={item.id} active={!!contactSelected}>
					{() => (
						<ListParticipant
							item={item}
							selected={!!contactSelected}
							onClickCb={onClickListedContact}
							isDisabled={chipInputError}
							updateOwnership={updateOwnership}
							isOwner={contactSelected?.owner || false}
							canBeModerator={canSelectOwnership}
						/>
					)}
				</ListItem>
			);
		});
		if (hasMore) {
			Items.push(
				<Container width="fill" padding="0.5rem" key="load-more">
					<Button label={showMoreUsersLabel} type="ghost" onClick={loadMoreContacts} />
				</Container>
			);
		}
		return Items;
	}, [
		canSelectOwnership,
		chipInputError,
		contactsSelected,
		hasMore,
		loadMoreContacts,
		onClickListedContact,
		searchResult,
		showMoreUsersLabel,
		updateOwnership
	]);

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
				placeholder={chipInputPlaceholder ?? inputPlaceholder}
				description={inputDescription}
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
