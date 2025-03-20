/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import React, { FC, RefObject, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, Icon, Popover, Text, PopoverProps } from '@zextras/carbonio-design-system';
import { map } from 'lodash';

import UserPopoverRow from './UserPopoverRow';

export type UserPopoverListProps = {
	anchorEl: RefObject<HTMLElement>;
	userList: string[];
	title?: string;
	icon?: string;
	iconColor?: string;
	displayPresence?: boolean;
	placement?: PopoverProps['placement'];
};

const UserPopoverList: FC<UserPopoverListProps> = ({
	anchorEl,
	userList,
	title,
	icon,
	iconColor = 'text',
	displayPresence = false,
	placement = 'top-end'
}) => {
	const [open, setOpen] = useState(false);

	const ref = React.createRef<HTMLDivElement>();

	useEffect(() => {
		if (anchorEl.current) {
			anchorEl.current.onclick = (): void => setOpen(true);
		}
	}, [anchorEl]);

	const handleScroll = useCallback(
		(event: Event) => {
			if (open && !ref.current?.contains(event.target as Node)) {
				anchorEl.current?.click();
			}
		},
		[anchorEl, open, ref]
	);

	useEffect(() => {
		document.addEventListener('scroll', handleScroll, true);
		return (): void => {
			document.removeEventListener('scroll', handleScroll, true);
		};
	}, [handleScroll]);

	const users = useMemo(
		() =>
			map(userList, (userId, index) => (
				<UserPopoverRow key={index} userId={userId} displayPresence={displayPresence} />
			)),
		[displayPresence, userList]
	);

	return (
		<Popover
			ref={ref}
			anchorEl={anchorEl}
			open={open}
			placement={placement}
			disablePortal
			styleAsModal
			onClose={() => setOpen(false)}
		>
			<Container gap="0.5rem" padding="small">
				{title && (
					<Container gap="0.5rem" orientation="horizontal" mainAlignment="flex-start">
						{icon && <Icon icon={icon} color={iconColor} />}
						<Text size="small" color="gray1">
							{title}
						</Text>
					</Container>
				)}
				<Container
					mainAlignment="flex-start"
					maxHeight="20vh"
					gap="0.5rem"
					style={{ overflowY: 'scroll' }}
				>
					{users}
				</Container>
			</Container>
		</Popover>
	);
};

export default UserPopoverList;
