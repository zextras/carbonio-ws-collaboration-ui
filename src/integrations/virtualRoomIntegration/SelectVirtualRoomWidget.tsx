/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import {
	Container,
	Select,
	Text,
	SelectItem,
	SingleSelectionOnChange,
	Icon,
	Button,
	Row
} from '@zextras/carbonio-design-system';
import { find, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import CreateVirtualRoomModal from '../../chats/components/secondaryBar/virtualRoomWidget/CreateVirtualRoomModal';
import { getMeetingByMeetingId } from '../../network';
import { useVirtualRoomsList } from '../../store/selectors/RoomsSelectors';
import { Room } from '../../types/store/RoomTypes';
import { createMeetingLinkFromOutside, getMeetingIdFromLink } from '../../utils/MeetingsUtils';

export type defaultType = {
	label: string;
	link: string;
};

export type valueItem = {
	id: string;
	label: string;
	link?: string;
};

export type SelectVirtualRoomWidgetProps = {
	onChange: (value: valueItem) => null;
	defaultValue: defaultType | undefined;
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

	const virtualRoomLabel = t('appointment.input.label', 'Virtual Room');
	const createVirtualRoom = t('meeting.virtual.newRoom', 'Create new virtual room');
	const noVirtualRoomLabel = t('appointment.input.defaultValue', 'No Virtual Room selected');
	const manageVirtualRoomLabel = t(
		'appointment.virtual.managementHint',
		'You can edit or delete your Virtual Rooms in the Chat module.'
	);
	const notMyRoomLabel = t(
		'appointment.input.caption',
		'Be aware that you are not the owner of this Virtual Room, or it no longer exists.'
	);

	const limitedAccessLabel = t('appointment.input.limitedOption', 'Limited access');

	const virtualRoomIdsList = useVirtualRoomsList();

	const [defaultRoom, setDefaultRoom] = useState<defaultType | undefined>(undefined);
	const [defaultIsMyRoom, setDefaultIsMyRoom] = useState<boolean>(true);
	const [selectedItem, setSelectedItem] = useState<SelectItem<valueItem> | undefined>(undefined);
	const [showCreationModal, setShowCreationModal] = useState(false);

	const createModalRef = useRef<HTMLDivElement>(null);

	const toggleModal = useCallback(() => {
		setShowCreationModal((prevState) => !prevState);
	}, []);

	const items: SelectItem<valueItem>[] = useMemo(() => {
		const roomList: SelectItem<valueItem>[] = [];
		roomList.push({
			label: noVirtualRoomLabel,
			value: {
				id: 'no_room_selected',
				label: noVirtualRoomLabel
			},
			customComponent: (
				<CustomContainer width="fit" mainAlignment="flex-start" orientation="horizontal">
					<Text>{noVirtualRoomLabel}</Text>
				</CustomContainer>
			)
		});
		if (!defaultIsMyRoom) {
			roomList.push({
				label: defaultRoom?.label ?? '',
				value: {
					id: 'default_id',
					label: defaultRoom?.label ?? '',
					link: defaultRoom?.link
				},
				customComponent: (
					<CustomContainer
						width="fit"
						mainAlignment="flex-start"
						orientation="horizontal"
						gap="0.25rem"
					>
						<Icon icon="AlertTriangleOutline" />
						<CustomText>
							{defaultRoom?.label ?? ''} - {limitedAccessLabel}
						</CustomText>
					</CustomContainer>
				)
			});
		}
		roomList.push(
			...map(virtualRoomIdsList, (room: Room) => ({
				label: room.name ?? '',
				value: {
					id: room.id,
					label: room.name ?? '',
					link: createMeetingLinkFromOutside(room.meetingId)
				},
				customComponent: (
					<CustomContainer mainAlignment="flex-start" orientation="horizontal">
						<Text overflow="ellipsis">{room.name ?? ''}</Text>
					</CustomContainer>
				)
			}))
		);
		roomList.push({
			label: createVirtualRoom,
			value: {
				id: 'create_new_room',
				label: createVirtualRoom
			},
			customComponent: (
				<CustomContainer width="fill">
					<Button
						width="fill"
						color="primary"
						type="outlined"
						label={createVirtualRoom}
						onClick={toggleModal}
					/>
				</CustomContainer>
			)
		});
		roomList.push({
			label: manageVirtualRoomLabel,
			value: {
				id: 'manage_virtual_room',
				label: manageVirtualRoomLabel
			},
			disabled: true,
			customComponent: (
				<CustomContainer
					crossAlignment="center"
					orientation="horizontal"
					padding={{ bottom: '0.5rem' }}
				>
					<CustomText size="small" color="secondary">
						{manageVirtualRoomLabel}
					</CustomText>
				</CustomContainer>
			)
		});
		return roomList;
	}, [
		createVirtualRoom,
		defaultIsMyRoom,
		defaultRoom?.label,
		defaultRoom?.link,
		limitedAccessLabel,
		manageVirtualRoomLabel,
		noVirtualRoomLabel,
		toggleModal,
		virtualRoomIdsList
	]);

	const selection: SelectItem<valueItem> = useMemo(() => {
		if (defaultValue !== undefined) {
			const selectedItem = find(items, (item) => item.value.link === defaultValue?.link);
			if (selectedItem !== undefined) {
				setSelectedItem(selectedItem);
				return selectedItem;
			}
		}
		setSelectedItem(items[0]);
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

	useEffect(() => {
		setDefaultRoom(defaultValue);
		if (defaultValue !== undefined) {
			getMeetingByMeetingId(getMeetingIdFromLink(defaultValue.link))
				.then(() => {
					setDefaultIsMyRoom(true);
				})
				.catch(() => {
					setDefaultIsMyRoom(false);
				});
		}
		// this is needed because we don't want to check defaultValue more than once
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const selectionIsMyRoom = useMemo(() => {
		const element = find(virtualRoomIdsList, (element) => element.id === selection.value.id);
		return element !== undefined;
	}, [selection.value.id, virtualRoomIdsList]);

	const alertHasToAppear = useMemo(
		() => !selectionIsMyRoom && selectedItem?.label === defaultRoom?.label,
		[defaultRoom?.label, selectedItem?.label, selectionIsMyRoom]
	);

	return (
		<Container gap="0.5rem">
			<Container orientation="horizontal" mainAlignment="flex-start" gap="0.5rem">
				<Row takeAvailableSpace>
					<Select
						label={virtualRoomLabel}
						selection={selection}
						items={items}
						onChange={onChangeVirtualRoom}
						data-testid="select_virtual_room"
					/>
				</Row>
			</Container>
			{alertHasToAppear && (
				<CustomContainer orientation="horizontal" mainAlignment="flex-start" gap="0.25rem">
					<Icon icon="AlertTriangleOutline" color="secondary" />
					<Text size="small" color="secondary">
						{notMyRoomLabel}
					</Text>
				</CustomContainer>
			)}
			{showCreationModal && (
				<CreateVirtualRoomModal
					open={showCreationModal}
					onClose={() => setShowCreationModal(false)}
					createModalRef={createModalRef}
					onChangeVirtualRoom={onChangeVirtualRoom}
				/>
			)}
		</Container>
	);
};

const SelectVirtualRoomWidgetComponent: FC<SelectVirtualRoomWidgetProps> = ({
	onChange,
	defaultValue
}) => <SelectVirtualRoomWidget onChange={onChange} defaultValue={defaultValue} />;

export default SelectVirtualRoomWidgetComponent;
