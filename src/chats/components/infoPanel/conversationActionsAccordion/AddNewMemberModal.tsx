/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
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
	useRef
} from 'react';

import { Button, Checkbox, Container, Modal, Tooltip } from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import { useTranslation } from 'react-i18next';

import { getAttribute } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { Member } from '../../../../types/store/RoomTypes';
import ContactsSelector, { ContactsSelected } from '../../contactSelector/ContactsSelector';

type AddNewMemberProps = {
	addNewMemberModalOpen: boolean;
	addNewMember: () => void;
	closeModal: () => void;
	members: Member[] | undefined;
	contactsSelected: ContactsSelected;
	setContactsSelected: Dispatch<SetStateAction<ContactsSelected>>;
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
	setContactsSelected,
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

	const maxMembers = useStore((store) => getAttribute(store, 'maxGroupMembers')) as number;

	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (addNewMemberModalOpen && inputRef.current) {
			inputRef.current?.focus();
		}
	}, [addNewMemberModalOpen]);

	const onClickCheckbox = useCallback(() => setShowHistory((check) => !check), [setShowHistory]);

	const modalFooter = useMemo(
		() => (
			<Container orientation="horizontal" mainAlignment="space-between" data-testid="modal_footer">
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
		),
		[
			addNewMember,
			addNewMemberButtonLabel,
			contactsSelected,
			disabledButtonTooltip,
			onClickCheckbox,
			showConversationHistoryLabel,
			showHistory
		]
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
			<ContactsSelector
				contactsSelected={contactsSelected}
				setContactSelected={setContactsSelected}
				maxSelectionNumber={maxMembers - size(members)}
				canSelectOwnership
				currentMembers={members}
				customInputRef={inputRef}
			/>
		</Modal>
	);
};

export default AddNewMemberModal;
