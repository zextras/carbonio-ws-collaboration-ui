/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';

import {
	Container,
	Select,
	Text,
	SelectItem,
	SingleSelectionOnChange
} from '@zextras/carbonio-design-system';
import { find, map, tail } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getVirtualRoomsList } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { Room } from '../../../types/store/RoomTypes';
import { createMeetingLinkFromOutside } from '../../../utils/MeetingsUtils';

type defaultType = {
	label: string;
	link: string;
};

type valueItem = {
	id: string;
	label: string;
	title?: string;
	link?: string;
};

export type SelectVirtualRoomWidgetProps = {
	onChange: (value: valueItem) => null;
	defaultValue: defaultType;
};

const CustomContainer = styled(Container)`
	user-select: none;
	-webkit-user-select: none;
`;

const CustomText = styled(Text)`
	font-style: italic;
`;

const SelectVirtualRoomWidget: FC<SelectVirtualRoomWidgetProps> = ({ onChange, defaultValue }) => {
	const [t] = useTranslation();

	const noVirtualRoomLabel = t('appointment.input.defaultValue', 'No Virtual Room selected');
	const findVirtualRoomLabel = t(
		'appointment.placeholder.description',
		'You will find your Virtual Rooms here when you’re back.'
	);
	const goToChatsLabel = t(
		'appointment.placeholder.title',
		'You can go to Chats and create a Virtual Room to host your appointment.'
	);

	const virtualRoomIdsList = useStore(getVirtualRoomsList);

	const items: SelectItem<valueItem>[] = useMemo(
		() => [
			{
				label: noVirtualRoomLabel,
				value: {
					id: 'no_room_selected',
					label: noVirtualRoomLabel
				}
			},
			...map(virtualRoomIdsList, (room: Room) => ({
				label: room.name ?? '',
				value: {
					id: room.id,
					label: room.name ?? '',
					title: room.name ?? '',
					link: createMeetingLinkFromOutside(room.meetingId)
				}
			}))
		],
		[noVirtualRoomLabel, virtualRoomIdsList]
	);

	const selection: SelectItem<valueItem> = useMemo(() => {
		const rooms: SelectItem<valueItem>[] = tail(items);
		const selectedItem = find(rooms, (item) => item.value.link === defaultValue?.link);
		if (selectedItem !== undefined) return selectedItem;
		return items[0];
	}, [items, defaultValue]);

	const onChangeVirtualRoom: SingleSelectionOnChange<valueItem> = useCallback(
		(value: valueItem | null) => {
			if (value) {
				onChange(value);
			}
		},
		[onChange]
	);

	return virtualRoomIdsList.length !== 0 ? (
		<Select
			label="Virtual Room"
			selection={selection}
			items={items}
			onChange={onChangeVirtualRoom}
			data-testid="select_virtual_room"
		/>
	) : (
		<CustomContainer height="2.938rem" background={'gray5'}>
			<CustomText color="gray1" size="small" weight="light">
				{goToChatsLabel}
			</CustomText>
			<CustomText color="gray1" size="small" weight="light" data-testid="no_virtual_room">
				{findVirtualRoomLabel}
			</CustomText>
		</CustomContainer>
	);
};

const SelectVirtualRoomWidgetComponent: FC<SelectVirtualRoomWidgetProps> = ({
	onChange,
	defaultValue
}) => <SelectVirtualRoomWidget onChange={onChange} defaultValue={defaultValue} />;

export default SelectVirtualRoomWidgetComponent;
