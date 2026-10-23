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

import styled from '@emotion/styled';
import { Container, Input, Tooltip, Button } from '@zextras/carbonio-design-system';
import { openSecondaryBar } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

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

	const [filterHasFocus, setFilterHasFocus] = useState(false);
	const shouldFocusRef = useRef(false);

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

	const handleFunnelClick = useCallback(() => {
		shouldFocusRef.current = true;
		openSecondaryBar();
	}, []);

	const handleInputBlur = useCallback(() => {
		setFilterHasFocus(false);
	}, [setFilterHasFocus]);

	useEffect(() => {
		if (expanded && (filterHasFocus || shouldFocusRef.current)) {
			filterInputRef.current?.focus();
			shouldFocusRef.current = false;
			setFilterHasFocus(true);
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
							onClick={handleFunnelClick}
							color="text"
						/>
					</Tooltip>
				</CustomFunnelContainer>
			)}
		</FilterContainer>
	);
};

export default ConversationsFilter;
