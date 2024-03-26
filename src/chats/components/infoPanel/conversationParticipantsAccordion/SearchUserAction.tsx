/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useState } from 'react';

import { Input, IconButton, Container, Tooltip } from '@zextras/carbonio-design-system';
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

	const handleFilterChange = useCallback((ev: React.FormEvent<HTMLInputElement>): void => {
		setSearchInput(ev.currentTarget.value);
		setFilteredInput(ev.currentTarget.value);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const resetFilter = useCallback((): void => {
		setSearchInput('');
		setFilteredInput('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const CustomElement = useCallback(
		(): React.ReactElement => (
			<Tooltip
				placement="top"
				label={
					size(searchInput) > 0
						? closeSearchTooltip
						: isInsideMeeting
							? searchParticipantLabel
							: searchMemberLabel
				}
			>
				<IconButton
					data-testid="close_button"
					icon={size(searchInput) > 0 ? 'Close' : 'Search'}
					iconColor="text"
					onClick={resetFilter}
				/>
			</Tooltip>
		),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[searchInput]
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
