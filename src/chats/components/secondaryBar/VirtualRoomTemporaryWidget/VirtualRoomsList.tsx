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
	Row,
	Text,
	IconButton,
	Tooltip,
	CreateSnackbarFn,
	useSnackbar
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
`;

const ListContainer = styled(Container)`
	overflow-y: scroll;
`;

const CustomIconButton = styled(IconButton)`
	border-radius: 0.125rem;
`;

const VirtualRoomsList: FC<virtualRoomsListProps> = ({ setListVisibility, parentRef }) => {
	const [t] = useTranslation();

	const virtualRoomNameInput = t('meeting.virtual.creationInput', 'New Virtual Room’s name*');
	const noVirtualRoomsLabel = t(
		'meeting.virtual.emptyState',
		'The Rooms you create will be shown here'
	);
	const cancelTooltip = t('action.cancel', 'Cancel');
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

	const virtualRoomList = useStore(getTemporaryRoomIdsOrderedByCreation);
	const [inputHasFocus, setInputHasFocus] = useState(false);
	const [canCreateVirtualRoom, setCanCreateVirtualRoom] = useState(false);
	const [nameError, setNameError] = useState(false);

	const inputRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLInputElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

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
		RoomsApi.addRoom({
			name: textRef.current?.value ?? '',
			type: RoomType.TEMPORARY
		})
			.then(() => {
				textRef.current!.value = '';
				setInputHasFocus(false);
				setCanCreateVirtualRoom(false);
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'error',
					label: errorSnackbar,
					hideButton: true
				});
			});
	}, [createSnackbar, errorSnackbar]);

	const handleDeleteNameClick = useCallback(() => {
		if (textRef.current) {
			textRef.current.value = '';
			textRef.current.focus();
			setCanCreateVirtualRoom(false);
			setNameError(false);
		}
	}, []);

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

	const inputSection = useMemo(
		() => (
			<Container orientation="horizontal" ref={inputRef}>
				<Row takeAvailableSpace>
					<Input
						backgroundColor="gray6"
						label={virtualRoomNameInput}
						inputRef={textRef}
						onChange={handleOnChangeInput}
						hasError={nameError}
					/>
				</Row>
				{inputHasFocus && (
					<Row width="fit" orientation="horizontal" gap="0.5rem" padding={{ horizontal: '0.5rem' }}>
						<Tooltip label={cancelTooltip}>
							<CustomIconButton
								size="large"
								icon="CloseOutline"
								iconColor="gray6"
								backgroundColor="secondary"
								onClick={handleDeleteNameClick}
							/>
						</Tooltip>
						<Tooltip
							label={
								nameError
									? invalidNameString
									: canCreateVirtualRoom
										? createTooltip
										: roomNameRequiredTooltip
							}
						>
							<CustomIconButton
								size="large"
								icon="CheckmarkOutline"
								iconColor="gray6"
								backgroundColor="primary"
								onClick={handleCreateButtonClick}
								disabled={!canCreateVirtualRoom}
							/>
						</Tooltip>
					</Row>
				)}
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
			invalidNameString,
			nameError,
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
