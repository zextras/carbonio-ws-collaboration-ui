/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Input, IconButton } from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getSidebarFilterHasFocus } from '../../store/selectors/SidebarSelectors';
import useStore from '../../store/Store';

const CustomFunnelContainer = styled(Container)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
`;

type ConversationsFilterProps = {
	expanded: boolean;
	setFilteredInput: Dispatch<SetStateAction<string>>;
};

const ConversationsFilter: FC<ConversationsFilterProps> = ({ expanded, setFilteredInput }) => {
	const [t] = useTranslation();
	const filterLabel = t('conversationFilter.label', 'Type to filter list');

	const filterHasFocus = useStore((store) => getSidebarFilterHasFocus(store));
	const setFilterHasFocus = useStore((store) => store.setFilterHasFocus);

	const [searchInput, setSearchInput] = useState('');

	const filterInputRef = useRef<HTMLInputElement>(null);

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

	const handleInputFocus = useCallback(() => {
		setFilterHasFocus(true);
	}, [setFilterHasFocus]);

	const handleInputBlur = useCallback(() => {
		setFilterHasFocus(false);
	}, [setFilterHasFocus]);

	useEffect(() => {
		if (filterHasFocus) {
			filterInputRef.current?.focus();
		}
		if (!expanded) {
			handleInputBlur();
		}
	}, [expanded, filterHasFocus, handleInputBlur]);

	return expanded ? (
		<Container height="fit" crossAlignment="flex-end">
			<Input
				data-testid="filter_input"
				inputRef={filterInputRef}
				height="2.938rem"
				backgroundColor="gray5"
				borderColor="gray3"
				label={filterLabel}
				value={searchInput}
				onChange={handleFilterChange}
				onFocus={handleInputFocus}
				CustomIcon={(): JSX.Element => (
					<IconButton
						icon={size(searchInput) > 0 ? 'CloseOutline' : 'FunnelOutline'}
						size="large"
						customSize={{ paddingSize: '0.25rem' }}
						onClick={resetFilter}
					/>
				)}
			/>
		</Container>
	) : (
		<CustomFunnelContainer height="3rem">
			<IconButton
				icon="FunnelOutline"
				size="large"
				customSize={{ paddingSize: '0.25rem' }}
				onClick={handleInputFocus}
			/>
		</CustomFunnelContainer>
	);
};

export default ConversationsFilter;
