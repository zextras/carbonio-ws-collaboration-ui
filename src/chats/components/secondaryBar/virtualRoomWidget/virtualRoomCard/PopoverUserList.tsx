/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import React, { FC, RefObject, useEffect, useMemo, useState } from 'react';

import { Container, Icon, Popover, Text } from '@zextras/carbonio-design-system';
import { map } from 'lodash';

import UserInfoRow from '../../../UserInfoRow';

type PopoverUserListProps = {
	anchorEl: RefObject<HTMLElement>;
	title: string;
	icon?: string;
	userList: string[];
};

const PopoverUserList: FC<PopoverUserListProps> = ({ anchorEl, title, icon, userList }) => {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (anchorEl.current) {
			anchorEl.current.onclick = (): void => setOpen(true);
		}
	}, [anchorEl]);

	const users = useMemo(
		() => map(userList, (userId, index) => <UserInfoRow key={index} userId={userId} />),
		[userList]
	);
	return (
		<Popover
			anchorEl={anchorEl}
			open={open}
			placement="right"
			disablePortal
			styleAsModal
			onClose={() => setOpen(false)}
		>
			<Container gap="0.5rem" padding="small">
				<Container gap="0.5rem" orientation="horizontal" mainAlignment="flex-start">
					{icon && <Icon icon={icon} />}
					<Text size="small" color="gray1">
						{title}
					</Text>
				</Container>
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

export default PopoverUserList;
