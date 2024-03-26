/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Button,
	Container,
	CreateSnackbarFn,
	Modal,
	Padding,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { find, map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import ChatCreationContactsSelection, { ContactSelected } from './ChatCreationContactsSelection';
import ChatCreationTitleInput from './ChatCreationTitleInput';
import useRouting from '../../../hooks/useRouting';
import { RoomsApi } from '../../../network';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/network/models/roomBeTypes';
import { AddRoomResponse } from '../../../types/network/responses/roomsResponses';

const ChatCreationModal = ({
	open,
	onClose
}: {
	open: boolean;
	onClose: () => void;
}): ReactElement => {
	const [t] = useTranslation();
	const titlePlaceholder = t('titlePlaceholder', "Your Group's title");
	const disabledButtonTooltip = t('tooltip.disableModalButton', 'Choose at least one address');
	const errorLabelDisabled = t('editModal.errorDisabled', 'Check the information entered');
	const newChatLabel = t('modal.creation.newChat', 'New Chat');
	const newGroupLabel = t('modal.creation.newGroup', 'New Group');
	const descriptionLabel = t(
		'modal.creation.description',
		'Chats are one-to-one conversations that help you to stay in touch with your contacts. You can create a Group by including more than two addresses'
	);
	const createLabel = t('action.create', 'Create');
	const closeLabel = t('action.close', 'Close');
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);
	const setPlaceholderRoom = useStore((state) => state.setPlaceholderRoom);

	const inputRef = useRef<HTMLInputElement>(null);

	const [chatType, setChatType] = useState<RoomType.ONE_TO_ONE | RoomType.GROUP>(
		RoomType.ONE_TO_ONE
	);
	const [contactsSelected, setContactSelected] = useState<ContactSelected>({});
	const [title, setTitle] = useState<string>(titlePlaceholder);
	const [topic, setTopic] = useState<string>('');
	const [isPending, setIsPending] = useState<boolean>(false);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const { goToRoomPage } = useRouting();

	useEffect(() => {
		if (size(contactsSelected) > 1) {
			setChatType(RoomType.GROUP);
		} else {
			setChatType(RoomType.ONE_TO_ONE);
		}
		if (open && inputRef.current) {
			inputRef.current.focus();
		}
	}, [contactsSelected, open]);

	const modalTitle = useMemo(
		() => (chatType === RoomType.ONE_TO_ONE ? newChatLabel : newGroupLabel),
		[chatType, newChatLabel, newGroupLabel]
	);
	const createButtonLabel = useMemo(
		() => (chatType === RoomType.ONE_TO_ONE ? createLabel : newGroupLabel),
		[chatType, createLabel, newGroupLabel]
	);
	const titleError = useMemo(() => title.length === 0 || title.length > 128, [title]);
	const topicError = useMemo(() => topic.length > 256, [topic]);

	const disabledCreateButton = useMemo(() => {
		if (chatType === RoomType.ONE_TO_ONE) {
			return size(contactsSelected) === 0;
		}
		return titleError || topicError;
	}, [chatType, titleError, topicError, contactsSelected]);

	const onModalClose = useCallback(() => {
		setChatType(RoomType.ONE_TO_ONE);
		setContactSelected({});
		setTitle(titlePlaceholder);
		setTopic('');
		onClose();
	}, [onClose, titlePlaceholder]);

	const onCreateOneToOne = useCallback(
		(userId: string) => {
			const oneToOneChatExist = find(
				useStore.getState().rooms,
				(room) =>
					room.type === RoomType.ONE_TO_ONE &&
					!!find(room.members, (member) => member.userId === userId)
			);
			const roomId = oneToOneChatExist?.id ?? `placeholder-${userId}`;
			if (!oneToOneChatExist) setPlaceholderRoom(userId);
			onModalClose();
			goToRoomPage(roomId);
		},
		[goToRoomPage, onModalClose, setPlaceholderRoom]
	);

	const onCreateGroup = useCallback(
		(ids: string[]) => {
			setIsPending(true);
			RoomsApi.addRoom({
				name: title,
				description: topic,
				type: RoomType.GROUP,
				membersIds: ids
			})
				.then((response: AddRoomResponse) => {
					setIsPending(false);
					goToRoomPage(response.id);
					onModalClose();
				})
				.catch(() => {
					setIsPending(false);
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'error',
						label: errorSnackbar
					});
				});
		},
		[createSnackbar, errorSnackbar, goToRoomPage, onModalClose, title, topic]
	);

	const onCreate = useCallback(() => {
		const ids = map(contactsSelected, (chip) => chip.id);
		if (chatType === RoomType.ONE_TO_ONE) {
			onCreateOneToOne(ids[0]);
		} else {
			onCreateGroup(ids);
		}
	}, [contactsSelected, chatType, onCreateOneToOne, onCreateGroup]);

	const modalFooter = useMemo(
		() => (
			<Tooltip
				label={
					disabledCreateButton
						? titleError || topicError
							? errorLabelDisabled
							: disabledButtonTooltip
						: createButtonLabel
				}
				placement="right"
			>
				<Container crossAlignment="flex-end">
					<Button
						label={createButtonLabel}
						onClick={onCreate}
						disabled={disabledCreateButton || isPending}
						data-testid="create_button"
					/>
				</Container>
			</Tooltip>
		),
		[
			disabledCreateButton,
			titleError,
			topicError,
			errorLabelDisabled,
			disabledButtonTooltip,
			createButtonLabel,
			onCreate,
			isPending
		]
	);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.value = '';
		}
	}, [contactsSelected]);

	return (
		<Modal
			open={open}
			title={modalTitle}
			showCloseIcon
			closeIconTooltip={closeLabel}
			onClose={onModalClose}
			size="medium"
			customFooter={modalFooter}
		>
			<Text overflow="break-word" size="small">
				{descriptionLabel}
			</Text>
			<Padding bottom="medium" />
			<ChatCreationContactsSelection
				contactsSelected={contactsSelected}
				setContactSelected={setContactSelected}
				isCreationModal
				inputRef={inputRef}
			/>
			{chatType === RoomType.GROUP && (
				<ChatCreationTitleInput
					title={title}
					setTitle={setTitle}
					setTopic={setTopic}
					topic={topic}
					titleError={titleError}
					topicError={topicError}
				/>
			)}
		</Modal>
	);
};

export default ChatCreationModal;
