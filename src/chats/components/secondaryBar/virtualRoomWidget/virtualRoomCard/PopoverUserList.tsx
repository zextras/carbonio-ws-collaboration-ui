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
	const [isHovered, setIsHovered] = useState(false);

	useEffect(() => {
		if (anchorEl.current) {
			anchorEl.current.onmouseenter = (): void => setIsHovered(true);
			anchorEl.current.onmouseleave = (): void => setIsHovered(false);
		}
	}, [anchorEl]);

	const users = useMemo(
		() => map(userList, (userId, index) => <UserInfoRow key={index} userId={userId} />),
		[userList]
	);
	return (
		<Popover
			anchorEl={anchorEl}
			open={isHovered}
			placement="right"
			disablePortal
			styleAsModal
			onClose={() => {}}
		>
			<Container gap="0.5rem" padding="small">
				<Container gap="0.5rem" orientation="horizontal" mainAlignment="flex-start">
					{icon && <Icon icon={icon} />}
					<Text size="small" color="gray1">
						{title}
					</Text>
				</Container>
				<Container mainAlignment="flex-start" gap="0.5rem">
					{users}
				</Container>
			</Container>
		</Popover>
	);
};

export default PopoverUserList;
