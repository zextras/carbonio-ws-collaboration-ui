/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
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

import { Container, Input, Row, Text, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import VirtualRoomListElement from './VirtualRoomListElement';
import { RoomsApi } from '../../../../network';
import { getScheduledRoomIdsOrderedByCreation } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type virtualRoomsListProps = {
	setListVisibility: Dispatch<SetStateAction<boolean>>;
	parentRef: React.RefObject<HTMLDivElement>;
};

const CustomContainer = styled(Container)`
	position: fixed;
	width: 21.875rem;
	max-height: 31.25rem;
	bottom: 3rem;
	left: 3.6rem;
	border-radius: 0.5rem;
	box-shadow: 0 0 4px 0 rgba(166, 166, 166, 0.5);
`;

const ListContainer = styled(Container)`
	overflow-y: scroll;
`;

const CustomIconButton = styled(IconButton)`
	border-radius: 0.125rem;
`;

const VirtualRoomsList: FC<virtualRoomsListProps> = ({ setListVisibility, parentRef }) => {
	const [t] = useTranslation();

	const virtualRoomNameInput = t(
		'meeting.scheduledMeetings.newVirtualRoom',
		'New Virtual Room’s name*'
	);
	const noVirtualRoomsLabel = t(
		'meeting.scheduledMeetings.noVirtualRooms',
		'The Rooms you create will be shown here'
	);

	const cancelTooltip = t('meeting.scheduledMeetings.cancelTooltip', 'Cancel');
	const createTooltip = t(
		'meeting.scheduledMeetings.createVirtualRoomTooltip',
		'Create new Virtual Room'
	);
	const roomNameRequiredTooltip = t(
		'meeting.scheduledMeetings.VirtualRoomNameRequiredTooltip',
		'Virtual Room’s name is required'
	);

	const virtualRoomList = useStore(getScheduledRoomIdsOrderedByCreation);
	const [inputHasFocus, setInputHasFocus] = useState(false);
	const [canCreateVirtualRoom, setCanCreateVirtualRoom] = useState(false);

	const inputRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLInputElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);

	const handleMouseUp = useCallback(
		(event) => {
			if (inputRef.current && inputRef.current.contains(event.target)) {
				setInputHasFocus(true);
			} else {
				setInputHasFocus(false);
			}
			if (
				(modalRef.current && modalRef.current.contains(event.target)) ||
				(parentRef.current && parentRef.current.contains(event.target))
			) {
				setListVisibility(true);
			} else if (popupRef.current && !popupRef.current.contains(event.target)) {
				setListVisibility(false);
			}
		},
		[parentRef, setListVisibility]
	);

	const handleCreateButtonClick = useCallback(() => {
		// TODO: test with group creation
		RoomsApi.addRoom({
			name: textRef.current?.value ?? '',
			description: '',
			type: RoomType.GROUP,
			membersIds: ['67286969-2713-48b0-901c-117c896ae50f', '2415efc7-8822-46f4-b34b-e86d12ba4d59']
		});
	}, []);

	const handleDeleteNameClick = useCallback(() => {
		if (textRef.current) {
			textRef.current.value = '';
			textRef.current.focus();
			setCanCreateVirtualRoom(false);
		}
	}, []);

	const handleOnChangeInput = useCallback(() => {
		if (size(textRef.current?.value) > 0) {
			setCanCreateVirtualRoom(true);
		} else {
			setCanCreateVirtualRoom(false);
		}
	}, []);

	// TODO error handling: when name is too long the input should became red and
	//  the create button should be disabled with "Invalid name" tooltip
	const inputSection = useMemo(
		() => (
			<Container orientation="horizontal" ref={inputRef}>
				<Row takeAvailableSpace>
					<Input
						backgroundColor="gray6"
						label={virtualRoomNameInput}
						inputRef={textRef}
						onChange={handleOnChangeInput}
					/>
				</Row>
				<Row width="fit" orientation="horizontal" gap="0.5rem" padding={{ horizontal: '0.5rem' }}>
					{inputHasFocus && (
						<>
							<Tooltip label={cancelTooltip}>
								<CustomIconButton
									size="large"
									icon="CloseOutline"
									iconColor="gray6"
									backgroundColor="secondary"
									onClick={handleDeleteNameClick}
								/>
							</Tooltip>
							<Tooltip label={canCreateVirtualRoom ? createTooltip : roomNameRequiredTooltip}>
								<CustomIconButton
									size="large"
									icon="CheckmarkOutline"
									iconColor="gray6"
									backgroundColor="primary"
									onClick={handleCreateButtonClick}
									disabled={!canCreateVirtualRoom}
								/>
							</Tooltip>
						</>
					)}
				</Row>
			</Container>
		),
		[
			canCreateVirtualRoom,
			cancelTooltip,
			createTooltip,
			handleCreateButtonClick,
			handleDeleteNameClick,
			handleOnChangeInput,
			inputHasFocus,
			roomNameRequiredTooltip,
			virtualRoomNameInput
		]
	);

	const virtualRoomListSection = useMemo(
		() =>
			map(virtualRoomList, (room) => (
				<VirtualRoomListElement roomId={room} modalRef={modalRef} key={`listItem-${room}`} />
			)),
		[virtualRoomList]
	);

	const noVirtualRoomSection = useMemo(
		() => (
			<Container padding="1rem">
				<Text color="gray1" size="small" weight="light">
					{noVirtualRoomsLabel}
				</Text>
			</Container>
		),
		[noVirtualRoomsLabel]
	);

	const listSection = useMemo(
		() => (virtualRoomList.length !== 0 ? virtualRoomListSection : noVirtualRoomSection),
		[noVirtualRoomSection, virtualRoomList.length, virtualRoomListSection]
	);

	useEffect(() => {
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [handleMouseUp]);

	return (
		<CustomContainer background="gray6" height="fit" padding="0.5rem" ref={popupRef}>
			{inputSection}
			<ListContainer>{listSection}</ListContainer>
		</CustomContainer>
	);
};

export default VirtualRoomsList;
