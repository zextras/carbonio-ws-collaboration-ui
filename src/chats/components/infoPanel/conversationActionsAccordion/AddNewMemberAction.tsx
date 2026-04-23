/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import AddNewMemberModal from './AddNewMemberModal';
import { RoomsApi } from '../../../../network';
import { getRoomMembers, getRoomNameSelector } from '../../../../store/selectors/RoomsSelectors';
import { getAttribute } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { AddMemberFields } from '../../../../types/network/models/roomBeTypes';
import { Member } from '../../../../types/store/RoomTypes';
import { ContactsSelected } from '../../contactSelector/ContactsSelector';

type AddNewMemberProps = {
	roomId: string;
};

const AddNewMemberAction: FC<AddNewMemberProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const addNewMemberTitle: string = t('action.addNewMembers', `Add new members`);
	const removeToAddNewOneLabel = t(
		'tooltip.removeToAddNewOne',
		'Remove someone to add new members'
	);

	const members: Member[] = useStore((state) => getRoomMembers(state, roomId));
	const roomName: string = useStore((state) => getRoomNameSelector(state, roomId));
	const maxMembers = useStore((store) => getAttribute(store, 'maxGroupMembers')) as number;

	const [contactsSelected, setContactsSelected] = useState<ContactsSelected>([]);
	const [addNewMemberModalOpen, setAddNewMemberModalOpen] = useState<boolean>(false);
	const [showHistory, setShowHistory] = useState<boolean>(false);

	const closeModal = useCallback(() => {
		setAddNewMemberModalOpen(false);
		setContactsSelected([]);
	}, []);

	const addNewMember = useCallback(() => {
		const members: AddMemberFields[] = [];
		map(contactsSelected, (contact) => {
			members.push({
				userId: contact.id,
				owner: !!contact.owner,
				historyCleared: !showHistory
			});
		});
		RoomsApi.addRoomMembers(roomId, members).then(() => closeModal());
	}, [closeModal, contactsSelected, roomId, showHistory]);

	const addMemberDisabled = useMemo(() => maxMembers <= size(members), [maxMembers, members]);

	return (
		<Container>
			<ActionComponent
				data-testId="addNewMemberAction"
				idComponent="addNewMemberAction"
				icon="PersonAddOutline"
				actionColor="primary"
				padding={{ top: 'small' }}
				label={addNewMemberTitle}
				withArrow
				action={(): void => setAddNewMemberModalOpen(true)}
				isDisabled={addMemberDisabled}
				disabledTooltip={removeToAddNewOneLabel}
			/>
			{addNewMemberModalOpen && (
				<AddNewMemberModal
					addNewMemberModalOpen={addNewMemberModalOpen}
					addNewMember={addNewMember}
					closeModal={closeModal}
					members={members}
					contactsSelected={contactsSelected}
					setContactsSelected={setContactsSelected}
					showHistory={showHistory}
					setShowHistory={setShowHistory}
					label={roomName}
				/>
			)}
		</Container>
	);
};

export default AddNewMemberAction;
