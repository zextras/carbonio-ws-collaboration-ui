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

import {
	Container,
	Input,
	Text,
	CreateSnackbarFn,
	useSnackbar,
	Button,
	Modal,
	Padding
} from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import VirtualRoomListElement from './VirtualRoomListElement';
import { RoomsApi } from '../../../../network';
import { getTemporaryRoomIdsOrderedByCreation } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type virtualRoomsListProps = {
	setListVisibility: Dispatch<SetStateAction<boolean>>;
	parentRef: React.RefObject<HTMLDivElement>;
};

const CustomContainer = styled(Container)`
	position: fixed;
	width: 21.875rem;
	height: auto;
	max-height: 31.25rem;
	bottom: 3rem;
	left: 3.6rem;
	border-radius: 0.5rem;
	box-shadow: 0 0 4px 0 rgba(166, 166, 166, 0.5);
	z-index: 3;
`;

const ListContainer = styled(Container)`
	overflow-y: auto;
`;

const VirtualRoomsList: FC<virtualRoomsListProps> = ({ setListVisibility, parentRef }) => {
	const [t] = useTranslation();

	const virtualRoomNameInput = t('meeting.virtual.creationInput', 'New Virtual Room’s name*');
	const noVirtualRoomsLabel = t(
		'meeting.virtual.emptyState',
		'The Rooms you create will be shown here'
	);
	const closeLabel = t('action.close', 'Close');
	const createTooltip = t('meeting.virtual.createTooltip', 'Create new Virtual Room');
	const roomNameRequiredTooltip = t(
		'meeting.virtual.nameRequiredTooltip',
		'Virtual Room’s name is required'
	);
	const invalidNameString = t('meeting.virtual.invalidNameTooltip', 'Invalid name');
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);
	const newRoomModalDescription = t(
		'',
		'Give to this Room a recognizable name in order to let your attendees know what they are expecting to meet about.'
	);

	const virtualRoomList = useStore(getTemporaryRoomIdsOrderedByCreation);
	const [canCreateVirtualRoom, setCanCreateVirtualRoom] = useState(false);
	const [nameError, setNameError] = useState(false);
	const [showCreationModal, setShowCreationModal] = useState(false);

	const textRef = useRef<HTMLInputElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const createModalRef = useRef<HTMLDivElement>(null);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const handleMouseUp = useCallback(
		(event: MouseEvent) => {
			if (
				modalRef.current?.contains(event.target as Node) ||
				parentRef.current?.contains(event.target as Node) ||
				createModalRef.current?.contains(event.target as Node)
			) {
				setListVisibility(true);
			} else if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
				setListVisibility(false);
			}
		},
		[parentRef, setListVisibility]
	);

	const handleCreateButtonClick = useCallback(() => {
		RoomsApi.addRoom({
			name: textRef.current?.value ?? '',
			type: RoomType.TEMPORARY
		})
			.then(() => {
				setCanCreateVirtualRoom(false);
				setShowCreationModal(false);
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'error',
					label: errorSnackbar,
					hideButton: true
				});
			});
	}, [createSnackbar, errorSnackbar]);

	const handleOnChangeInput = useCallback(() => {
		const textSize = size(textRef.current?.value);
		if (textSize <= 0) {
			setCanCreateVirtualRoom(false);
			setNameError(false);
		} else if (textSize < 128) {
			setCanCreateVirtualRoom(true);
			setNameError(false);
		} else {
			textRef.current!.value = textRef.current!.value.slice(0, 128);
			setCanCreateVirtualRoom(false);
			setNameError(true);
		}
	}, []);

	const createVirtualRoomTooltip = useMemo(() => {
		if (nameError) return invalidNameString;
		if (canCreateVirtualRoom) return createTooltip;
		return roomNameRequiredTooltip;
	}, [canCreateVirtualRoom, createTooltip, invalidNameString, nameError, roomNameRequiredTooltip]);

	const toggleModal = useCallback(() => {
		setShowCreationModal((prevState) => !prevState);
	}, []);

	const newRoomModal = useMemo(
		() => (
			<Modal
				open={showCreationModal}
				title="Create new Virtual Room"
				confirmColor="primary"
				onConfirm={handleCreateButtonClick}
				confirmLabel="create"
				confirmDisabled={!canCreateVirtualRoom}
				confirmTooltip={createVirtualRoomTooltip}
				showCloseIcon
				onClose={toggleModal}
				closeIconTooltip={closeLabel}
				ref={createModalRef}
			>
				<Text overflow="break-word" size="small">
					{newRoomModalDescription}
				</Text>
				<Padding bottom="1rem" />
				<Input
					backgroundColor="gray6"
					label={virtualRoomNameInput}
					inputRef={textRef}
					onChange={handleOnChangeInput}
					hasError={nameError}
					description={nameError ? invalidNameString : ''}
				/>
			</Modal>
		),
		[
			canCreateVirtualRoom,
			closeLabel,
			createVirtualRoomTooltip,
			handleCreateButtonClick,
			handleOnChangeInput,
			invalidNameString,
			nameError,
			newRoomModalDescription,
			showCreationModal,
			toggleModal,
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
				<Text color="gray1" size="small" weight="light" overflow="break-word">
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

		return (): void => {
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [handleMouseUp]);

	return (
		<CustomContainer background={'gray6'} height="fit" padding="0.5rem" gap="0.5rem" ref={popupRef}>
			<Button label="Create new Room" color="primary" width="fill" onClick={toggleModal} />
			<ListContainer gap="0.5rem" mainAlignment="flex-start">
				{listSection}
			</ListContainer>
			{newRoomModal}
		</CustomContainer>
	);
};

export default VirtualRoomsList;
