/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Avatar, Checkbox, Container, Padding, Row, Text } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';

import { ContactInfo } from './ChatCreationContactsSelection';

type ListParticipantProps = {
	item: ContactInfo;
	selected: boolean;
	onClickCb: (item: ContactInfo) => void;
};

const ListParticipant = ({ item, selected, onClickCb }: ListParticipantProps): ReactElement => (
	<Padding vertical="small">
		<Container
			onClick={onClickCb(item)}
			orientation="horizontal"
			mainAlignment="flex-start"
			width="fill"
		>
			<Row>
				<Checkbox value={selected} />
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
	</Padding>
);

export default ListParticipant;
