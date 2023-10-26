/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { MouseEventHandler, ReactElement } from 'react';

import {
	Avatar,
	Checkbox,
	Container,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { ContactInfo } from './ChatCreationContactsSelection';

type ListParticipantProps = {
	item: ContactInfo;
	selected: boolean;
	onClickCb: (item: ContactInfo) => MouseEventHandler<HTMLDivElement> | undefined;
	isDisabled?: boolean;
};

const SelectableText = styled(Text)`
	user-select: text;
`;

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
					data-testid={`chip-${item.email}`}
					onClick={onClickCb(item)}
					orientation="horizontal"
					mainAlignment="flex-start"
					width="fill"
				>
					<Row>
						<Checkbox
							data-testid={`checkbox-chip-${item.email}`}
							value={selected}
							disabled={!selected && isDisabled}
						/>
						<Padding horizontal="small">
							<Avatar label={item.name} />
						</Padding>
						<Container crossAlignment="flex-start" width="fit">
							<Text size="small">{item.name}</Text>
							<Padding top="extrasmall" />
							<SelectableText
								data-testid={`${item.id}-emailSelectable`}
								size="extrasmall"
								color="gray1"
							>
								{item.email}
							</SelectableText>
						</Container>
					</Row>
				</Container>
			</Tooltip>
		</Padding>
	);
};

export default ListParticipant;
