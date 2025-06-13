/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	CreateSnackbarFn,
	Modal,
	Padding,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { find, map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import ChatCreationTitleInput from './ChatCreationTitleInput';
import useRouting from '../../../hooks/useRouting';
import { RoomsApi } from '../../../network';
import { getAttribute } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { MemberBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { AddRoomResponse } from '../../../types/network/responses/roomsResponses';
import ContactsSelector, { ContactsSelected } from '../contactSelector/ContactsSelector';

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
	const listTextLabel = t(
		'modal.creation.contactList',
		'Select more than one address to create a Group'
	);

	const setPlaceholderRoom = useStore((state) => state.setPlaceholderRoom);
	const privateChatCreation = useStore((store) => getAttribute(store, 'privateChatCreation'));
	const groupChatCreation = useStore((store) => getAttribute(store, 'groupChatCreation'));
	const maxMembers = useStore((store) => getAttribute(store, 'maxGroupMembers')) as number;

	const [contactsSelected, setContactsSelected] = useState<ContactsSelected>([]);
	const [title, setTitle] = useState<string>(titlePlaceholder);
	const [topic, setTopic] = useState<string>('');
	const [isPending, setIsPending] = useState<boolean>(false);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const { goToRoomPage } = useRouting();

	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open && inputRef.current) {
			inputRef.current.focus();
		}
	}, [open]);

	const chatType = useMemo(
		() =>
			size(contactsSelected) > 1 || !privateChatCreation ? RoomType.GROUP : RoomType.ONE_TO_ONE,
		[contactsSelected, privateChatCreation]
	);

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
		return size(contactsSelected) < 2 || titleError || topicError;
	}, [chatType, titleError, topicError, contactsSelected]);

	const onModalClose = useCallback(() => {
		setContactsSelected([]);
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
		(ids: MemberBe[]) => {
			setIsPending(true);
			RoomsApi.addRoom({
				name: title,
				description: topic,
				type: RoomType.GROUP,
				members: ids
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
						severity: 'error',
						label: errorSnackbar
					});
				});
		},
		[createSnackbar, errorSnackbar, goToRoomPage, onModalClose, title, topic]
	);

	const onCreate = useCallback(() => {
		const ids: MemberBe[] = map(contactsSelected, (contact) => ({
			userId: contact.id,
			owner: !!contact.owner
		}));
		if (chatType === RoomType.ONE_TO_ONE) {
			onCreateOneToOne(ids[0].userId);
		} else {
			onCreateGroup(ids);
		}
	}, [contactsSelected, chatType, onCreateOneToOne, onCreateGroup]);

	const createButtonTooltip = useMemo(() => {
		if (disabledCreateButton) {
			if (titleError || topicError) return errorLabelDisabled;
			return disabledButtonTooltip;
		}
		return createButtonLabel;
	}, [
		disabledCreateButton,
		createButtonLabel,
		titleError,
		topicError,
		disabledButtonTooltip,
		errorLabelDisabled
	]);

	const maxSelectionNumber = useMemo(() => {
		if (chatType === RoomType.GROUP) return maxMembers - 1;
		if (!groupChatCreation) return 1;
		return undefined;
	}, [chatType, groupChatCreation, maxMembers]);

	return (
		<Modal
			open={open}
			size="medium"
			title={modalTitle}
			onConfirm={onCreate}
			confirmLabel={createButtonLabel}
			confirmDisabled={disabledCreateButton || isPending}
			confirmTooltip={createButtonTooltip}
			showCloseIcon
			closeIconTooltip={closeLabel}
			onClose={onModalClose}
		>
			<Text overflow="break-word" size="small">
				{descriptionLabel}
			</Text>
			<Padding bottom="medium" />
			<ContactsSelector
				contactsSelected={contactsSelected}
				setContactSelected={setContactsSelected}
				maxSelectionNumber={maxSelectionNumber}
				canSelectOwnership={size(contactsSelected) > 1}
				customInputRef={inputRef}
			/>
			{groupChatCreation && (
				<>
					<Padding bottom="large" />
					<Text color="gray1">{listTextLabel}</Text>
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
				</>
			)}
		</Modal>
	);
};

export default ChatCreationModal;
