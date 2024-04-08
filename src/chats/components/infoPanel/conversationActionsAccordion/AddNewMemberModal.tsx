/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef } from 'react';

import { Button, Checkbox, Container, Modal, Tooltip } from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import { useTranslation } from 'react-i18next';

import { Member } from '../../../../types/store/RoomTypes';
import ChatCreationContactsSelection, {
	ContactSelected
} from '../../creationModal/ChatCreationContactsSelection';

type AddNewMemberProps = {
	addNewMemberModalOpen: boolean;
	addNewMember: () => void;
	closeModal: () => void;
	members: Member[] | undefined;
	contactsSelected: ContactSelected;
	setContactSelected: Dispatch<SetStateAction<ContactSelected>>;
	showHistory: boolean;
	setShowHistory: Dispatch<SetStateAction<boolean>>;
	label: string;
};

const AddNewMemberModal: FC<AddNewMemberProps> = ({
	addNewMemberModalOpen,
	addNewMember,
	closeModal,
	members,
	contactsSelected,
	setContactSelected,
	showHistory,
	setShowHistory,
	label
}) => {
	const [t] = useTranslation();
	const disabledButtonTooltip = t('tooltip.disableModalButton', 'Choose at least one address');
	const addNewMemberLabel = t('action.addNewMembersTo', `Add new members to ${label}`, {
		roomName: label
	});
	const showConversationHistoryLabel = t(
		'modal.showPreviousConversationHistory',
		'Show previous chat history'
	);
	const addNewMemberButtonLabel = t('action.addNewMembers', 'Add new members');
	const closeLabel = t('action.close', 'Close');

	const inputRef = useRef<HTMLInputElement>(null);

	const onClickCheckbox = useCallback(
		() => setShowHistory((check) => !check),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.value = '';
		}
	}, [contactsSelected]);

	const modalFooter = (
		<Container orientation="horizontal" mainAlignment="space-between">
			<Container crossAlignment="flex-start" width="fit">
				<Checkbox
					label={showConversationHistoryLabel}
					value={showHistory}
					onClick={onClickCheckbox}
				/>
			</Container>
			<Tooltip label={disabledButtonTooltip} disabled={size(contactsSelected) !== 0}>
				<Container crossAlignment="flex-end" width="fit">
					<Button
						label={addNewMemberButtonLabel}
						onClick={addNewMember}
						disabled={size(contactsSelected) === 0}
						data-testid="add_new_member_button"
					/>
				</Container>
			</Tooltip>
		</Container>
	);

	return (
		<Modal
			size="medium"
			open={addNewMemberModalOpen}
			title={addNewMemberLabel}
			customFooter={modalFooter}
			confirmColor="primary"
			showCloseIcon
			onClose={closeModal}
			closeIconTooltip={closeLabel}
			data-testid="add_member_modal"
		>
			<Container>
				<ChatCreationContactsSelection
					contactsSelected={contactsSelected}
					setContactSelected={setContactSelected}
					members={members}
					inputRef={inputRef}
				/>
			</Container>
		</Modal>
	);
};

export default AddNewMemberModal;
