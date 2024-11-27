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
	useState
} from 'react';

import {
	ChipInput,
	ChipItem,
	Container,
	ListItem,
	List,
	Text,
	Spinner
} from '@zextras/carbonio-design-system';
import { debounce, difference, differenceBy, find, map, omit, size, union } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { searchUsersByFeatureRequest } from '../../../../network/soap/SearchUsersByFeatureRequest';
import {
	ContactInfo,
	SearchUsersByFeatureSoapResponse
} from '../../../../types/network/soap/searchUsersByFeatureRequest';
import { ContactSelected } from '../../creationModal/ChatCreationContactsSelection';
import ListParticipant from '../../creationModal/ListParticipant';

const CustomContainer = styled(Container)`
	cursor: default;
`;

const CustomList = styled(List)`
	padding-top: 0.5rem;
`;

type ModeratorContactsSelectionProps = {
	contactsSelected: ContactSelected;
	setContactSelected: Dispatch<SetStateAction<ContactSelected>>;
	inputRef: React.RefObject<HTMLInputElement>;
};

const ModeratorsContactsSelection = ({
	contactsSelected,
	setContactSelected,
	inputRef
}: ModeratorContactsSelectionProps): ReactElement => {
	const [t] = useTranslation();
	const noMatchLabel = t(
		'participantsList.noMatch.gal',
		'There are no items that match this search in your company.'
	);
	const inputPlaceholder = t('meeting.virtual.modal.moderator.input', `Room's moderators`);

	const [result, setResult] = useState<ContactInfo[]>([]);
	const [chips, setChips] = useState<ChipItem<ContactInfo>[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<boolean>(false);

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
				setResult(response);
				if (size(response) === 0) setError(true);
			})
			.catch(() => {
				setLoading(false);
			});
	}, []);

	const debouncedAutoComplete = useMemo(
		() =>
			debounce(() => {
				searchUsersByFeatureRequest(inputRef.current?.value ?? '')
					.then((response: SearchUsersByFeatureSoapResponse) => {
						setLoading(false);
						setResult(response);
						if (size(response) === 0) setError(true);
					})
					.catch(() => {
						setLoading(false);
					});
			}, 200),
		[inputRef]
	);

	// Search zimbra contacts on typing
	const handleChangeText = useCallback(() => {
		setLoading(true);
		setError(false);
		debouncedAutoComplete();
	}, [debouncedAutoComplete]);

	const addOrRemoveChip = useCallback((newChip: ChipItem<ContactInfo>) => {
		setChips((chips) =>
			find(chips, (chip) => chip.value?.id === newChip.value?.id)
				? differenceBy(chips, [newChip], (chip) => chip.value?.id)
				: union(chips, [newChip])
		);
	}, []);

	const nooP = useCallback(() => false, []);

	// update of chip aspect when contactsSelected changes
	useEffect(() => {
		setChips((prevChips) =>
			prevChips.map((chip) => {
				if (chip.value !== undefined && contactsSelected[chip.value.id]) {
					return {
						...chip
					};
				}
				return chip;
			})
		);
	}, [contactsSelected]);

	const createChip = useCallback(
		(item: ContactInfo): ChipItem<ContactInfo> => ({
			value: item,
			label: item.displayName || item.email
		}),
		[]
	);

	const onClickListItem = useCallback(
		(item: ContactInfo) => (): void => {
			const newChip: ChipItem<ContactInfo> = createChip(item);
			setContactSelected((contacts: ContactSelected) =>
				contacts[item.id]
					? omit(contacts, item.id)
					: { ...contacts, [item.id]: { ...item, owner: false } }
			);
			addOrRemoveChip(newChip);
		},
		[addOrRemoveChip, createChip, setContactSelected]
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
							updateOwner={nooP}
							isOwner={nooP}
							canBeModerator={false}
						/>
					)}
				</ListItem>
			)),
		[contactsSelected, nooP, onClickListItem, result]
	);

	const removeContactFromChip = useCallback(
		(newChips: ChipItem<ContactInfo>[]) => {
			const differenceChip = difference(chips, newChips)[0];
			const differenceChipId = differenceChip?.value?.id;
			if (size(chips) > size(newChips) && differenceChipId !== undefined) {
				setContactSelected((contacts: ContactSelected) => omit(contacts, differenceChipId));
				setChips((chips) => differenceBy(chips, [differenceChip], (chip) => chip.value?.id));
			}
		},
		[chips, setContactSelected]
	);

	const contentToDisplay = useMemo(() => {
		if (loading) {
			return <Spinner color="gray1" />;
		}
		if (!error) {
			return <CustomList data-testid="list_moderators_selection">{items}</CustomList>;
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
				data-testid="chip_input_moderators_selector"
				separators={[]}
			/>
			<Container height="9.375rem">{contentToDisplay}</Container>
		</>
	);
};

export default ModeratorsContactsSelection;
