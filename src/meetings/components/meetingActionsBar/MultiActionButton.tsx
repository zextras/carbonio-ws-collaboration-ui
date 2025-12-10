/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react';

import { Button, ButtonProps, Dropdown, DropdownProps } from '@zextras/carbonio-design-system';

interface ActionButtonProps extends Omit<
	ButtonProps,
	'secondaryAction' | 'size' | 'type' | 'color' | 'backgroundColor' | 'labelColor'
> {
	showItems: boolean;
	setShowItems: Dispatch<SetStateAction<boolean>>;
	items: DropdownProps['items'];
	listRef?: React.Ref<HTMLDivElement>;
}

export const MultiActionButton = React.forwardRef<HTMLDivElement, ActionButtonProps>(
	function MultiActionButtonFn(
		{ showItems, setShowItems, items, listRef, disabled, ...rest },
		ref
	): React.JSX.Element {
		const toggleDropdown = useCallback((): void => {
			setShowItems((prevState) => !prevState);
		}, [setShowItems]);

		const secondaryAction = useMemo(
			() =>
				({
					onClick: toggleDropdown,
					icon: showItems ? 'ChevronDown' : 'ChevronUp',
					forceActive: showItems,
					disabled
				}) satisfies NonNullable<ButtonProps['secondaryAction']>,
			[toggleDropdown, showItems, disabled]
		);

		return (
			<Dropdown
				forceOpen={showItems}
				disabled
				disableRestoreFocus
				items={items}
				width={'fit-content'}
				dropdownListRef={listRef}
				placement="top-end"
				triggerRef={ref}
			>
				<Button
					{...rest}
					secondaryAction={secondaryAction}
					size={'large'}
					disabled={disabled}
					type={'default'}
					color={'primary'}
				/>
			</Dropdown>
		);
	}
);
