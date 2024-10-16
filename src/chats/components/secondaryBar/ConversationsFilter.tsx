/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import { Container, Input, Tooltip, Button } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getSidebarFilterHasFocus } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

const FilterContainer = styled(Container)`
	height: fit-content;
	position: sticky;
	top: 0;
	z-index: 1;
`;

const CustomFunnelContainer = styled(Container)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
`;

const CustomButton = styled(Button)`
	padding: 0.25rem;
`;

type ConversationsFilterProps = {
	expanded: boolean;
	setFilteredInput: Dispatch<SetStateAction<string>>;
};

const ConversationsFilter: FC<ConversationsFilterProps> = ({ expanded, setFilteredInput }) => {
	const [t] = useTranslation();
	const filterLabel = t('conversationFilter.label', 'Type to filter list');
	const filterTooltip = t('conversationFilter.filterTooltip', 'Filter list');
	const closeTooltip = t('conversationFilter.closeTooltip', 'Close filter');

	const filterHasFocus = useStore((store) => getSidebarFilterHasFocus(store));
	const setFilterHasFocus = useStore((store) => store.setFilterHasFocus);

	const [searchInput, setSearchInput] = useState('');

	const filterInputRef = useRef<HTMLInputElement>(null);

	const handleFilterChange = useCallback(
		(ev: React.FormEvent<HTMLInputElement>): void => {
			setSearchInput(ev.currentTarget.value);
			setFilteredInput(ev.currentTarget.value.toLocaleLowerCase());
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

	const customFilterIcon = useMemo(
		() =>
			function icon(): JSX.Element {
				return (
					<Tooltip label={searchInput.length > 0 ? closeTooltip : filterTooltip}>
						<CustomButton
							type="ghost"
							color="text"
							icon={searchInput.length > 0 ? 'CloseOutline' : 'FunnelOutline'}
							size="large"
							onClick={resetFilter}
						/>
					</Tooltip>
				);
			},
		[closeTooltip, filterTooltip, resetFilter, searchInput]
	);

	return (
		<FilterContainer>
			{expanded ? (
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
						CustomIcon={customFilterIcon}
					/>
				</Container>
			) : (
				<CustomFunnelContainer height="3rem" background={'gray5'}>
					<Tooltip label={filterTooltip}>
						<CustomButton
							type="ghost"
							icon="FunnelOutline"
							size="large"
							onClick={handleInputFocus}
							color="gray5"
						/>
					</Tooltip>
				</CustomFunnelContainer>
			)}
		</FilterContainer>
	);
};

export default ConversationsFilter;
