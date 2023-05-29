/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Avatar,
	Checkbox,
	Container,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { ContactInfo } from './ChatCreationContactsSelection';

type ListParticipantProps = {
	item: ContactInfo;
	selected: boolean;
	onClickCb: (item: ContactInfo) => void;
	isDisabled?: boolean;
};

const ListParticipant = ({
	item,
	selected,
	onClickCb,
	isDisabled
}: ListParticipantProps): ReactElement => {
	const [t] = useTranslation();
	const removeToAddNewOneLabel = t(
		'tooltip.removeToAddNewOne',
		'Remove someone to add new members'
	);

	return (
		<Padding vertical="small">
			<Tooltip disabled={!isDisabled} label={removeToAddNewOneLabel}>
				<Container
					onClick={onClickCb(item)}
					orientation="horizontal"
					mainAlignment="flex-start"
					width="fill"
				>
					<Row>
						<Checkbox value={selected} disabled={!selected && isDisabled} />
						<Padding horizontal="small">
							<Avatar label={item.name} />
						</Padding>
						<Container crossAlignment="flex-start" width="fit">
							<Text size="small">{item.name}</Text>
							<Padding top="extrasmall" />
							<Text size="extrasmall" color="gray1">
								{item.email}
							</Text>
						</Container>
					</Row>
				</Container>
			</Tooltip>
		</Padding>
	);
};

export default ListParticipant;
