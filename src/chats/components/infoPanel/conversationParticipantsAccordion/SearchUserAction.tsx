/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import { Input, Container, Tooltip, Button } from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import { useTranslation } from 'react-i18next';

type SearchUserProps = {
	setFilteredInput: (element: string) => void;
	isInsideMeeting?: boolean;
};

const SearchUserAction: FC<SearchUserProps> = ({ setFilteredInput, isInsideMeeting }) => {
	const [t] = useTranslation();
	const searchMemberLabel: string = t('participantsList.searchMembers', 'Search members');
	const searchParticipantLabel: string = t(
		'participantsList.searchParticipants',
		'Search participants'
	);

	const closeSearchTooltip: string = t('participantsList.closeSearch', 'Close search');
	const [searchInput, setSearchInput] = useState('');

	const handleFilterChange = useCallback(
		(ev: React.FormEvent<HTMLInputElement>): void => {
			setSearchInput(ev.currentTarget.value);
			setFilteredInput(ev.currentTarget.value);
		},
		[setFilteredInput]
	);

	const resetFilter = useCallback((): void => {
		setSearchInput('');
		setFilteredInput('');
	}, [setFilteredInput]);

	const tooltipLabel = useMemo(() => {
		if (size(searchInput) > 0) {
			return closeSearchTooltip;
		}
		if (isInsideMeeting) {
			return searchParticipantLabel;
		}
		return searchMemberLabel;
	}, [closeSearchTooltip, isInsideMeeting, searchInput, searchMemberLabel, searchParticipantLabel]);

	const CustomElement = useCallback(
		(): React.ReactElement => (
			<Tooltip placement="top" label={tooltipLabel}>
				<Button
					type="ghost"
					data-testid="close_button"
					icon={size(searchInput) > 0 ? 'Close' : 'Search'}
					color="text"
					onClick={resetFilter}
				/>
			</Tooltip>
		),
		[resetFilter, searchInput, tooltipLabel]
	);

	return (
		<Container padding={{ top: 'large', bottom: 'small' }}>
			<Input
				label={isInsideMeeting ? searchParticipantLabel : searchMemberLabel}
				CustomIcon={CustomElement}
				onChange={handleFilterChange}
				value={searchInput}
				backgroundColor={isInsideMeeting ? 'gray0' : 'gray5'}
			/>
		</Container>
	);
};

export default SearchUserAction;
