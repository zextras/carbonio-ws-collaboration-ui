/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Button, Container, Modal, Padding, Text, Tooltip } from '@zextras/carbonio-design-system';
import { find, map, size } from 'lodash';
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useRouting from '../../hooks/useRouting';
import { RoomsApi } from '../../network';
import useStore from '../../store/Store';
import { AddRoomResponse } from '../../types/network/responses/roomsResponses';
import { RoomType } from '../../types/store/RoomTypes';
import ChatCreationContactsSelection, { ContactSelected } from './ChatCreationContactsSelection';
import ChatCreationTitleInput from './ChatCreationTitleInput';

const ChatCreationModal = ({
	open,
	onClose
}: {
	open: boolean;
	onClose: () => void;
}): ReactElement => {
	const [t] = useTranslation();
	const titlePlaceholder = t('titlePlaceholder', "Your Group's Title");
	const disabledButtonTooltip = t('tooltip.disableModalButton', 'Choose at least one address');
	const errorLabelDisabled = t('editModal.errorDisabled', 'Check the information entered');
	const newChatLabel = t('modal.creation.newChat', 'New Chat');
	const newGroupLabel = t('modal.creation.newGroup', 'New Group');
	const descriptionLabel = t(
		'modal.creation.description',
		'Chats are one-to-one conversations that help you to stay in touch with your contacts. You can create a group by including more than two participants'
	);
	const createLabel = t('action.create', 'Create');
	const closeLabel = t('action.close', 'Close');

	const addRoom = useStore((store) => store.addRoom);

	const [chatType, setChatType] = useState<RoomType.ONE_TO_ONE | RoomType.GROUP>(
		RoomType.ONE_TO_ONE
	);
	const [contactsSelected, setContactSelected] = useState<ContactSelected>({});
	const [title, setTitle] = useState<string>(titlePlaceholder);
	const [topic, setTopic] = useState<string>('');
	const [isPending, setIsPending] = useState<boolean>(false);

	const { goToRoomPage } = useRouting();

	useEffect(() => {
		if (size(contactsSelected) > 1) {
			setChatType(RoomType.GROUP);
		} else {
			setChatType(RoomType.ONE_TO_ONE);
		}
	}, [contactsSelected]);

	const modalTitle = useMemo(
		() => (chatType === RoomType.ONE_TO_ONE ? newChatLabel : newGroupLabel),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[chatType]
	);
	const createButtonLabel = useMemo(
		() => (chatType === RoomType.ONE_TO_ONE ? createLabel : newGroupLabel),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[chatType]
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

	const onCreate = useCallback(() => {
		const ids = map(contactsSelected, (chip) => chip.id);
		const oneToOneChatExist =
			chatType === RoomType.ONE_TO_ONE &&
			find(
				useStore.getState().rooms,
				(room) =>
					room.type === RoomType.ONE_TO_ONE &&
					!!find(room.members, (member) => member.userId === ids[0])
			);
		if (oneToOneChatExist) {
			goToRoomPage(oneToOneChatExist.id);
			onModalClose();
		} else {
			setIsPending(true);
			RoomsApi.addRoom({
				name: chatType === RoomType.ONE_TO_ONE ? ' ' : title,
				description: chatType === RoomType.ONE_TO_ONE ? ' ' : topic,
				type: chatType,
				membersIds: ids
			})
				.then((response: AddRoomResponse) => {
					setIsPending(false);
					addRoom(response);
					goToRoomPage(response.id);
					onModalClose();
				})
				.catch(() => null);
		}
	}, [addRoom, chatType, contactsSelected, goToRoomPage, onModalClose, title, topic]);

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
			<Padding bottom="large" />
			<ChatCreationContactsSelection
				contactsSelected={contactsSelected}
				setContactSelected={setContactSelected}
				isCreationModal
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
