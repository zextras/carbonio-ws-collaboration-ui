/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import AddNewMemberModal from './AddNewMemberModal';
import { RoomsApi } from '../../../../network';
import { getRoomMembers, getRoomNameSelector } from '../../../../store/selectors/RoomsSelectors';
import { getCapability } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { AddMemberFields } from '../../../../types/network/models/roomBeTypes';
import { Member } from '../../../../types/store/RoomTypes';
import { CapabilityType } from '../../../../types/store/SessionTypes';
import { ContactSelected } from '../../creationModal/ChatCreationContactsSelection';

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

	const members: Member[] | undefined = useStore((state) => getRoomMembers(state, roomId));
	const roomName: string = useStore((state) => getRoomNameSelector(state, roomId));
	const maxMembers = useStore((store) => getCapability(store, CapabilityType.MAX_GROUP_MEMBERS));

	const [contactsSelected, setContactsSelected] = useState<ContactSelected>({});
	const [addNewMemberModalOpen, setAddNewMemberModalOpen] = useState<boolean>(false);
	const [showHistory, setShowHistory] = useState<boolean>(false);

	const closeModal = useCallback(() => {
		setAddNewMemberModalOpen(false);
		setContactsSelected({});
	}, []);

	const addNewMember = useCallback(() => {
		map(contactsSelected, (contact) => {
			const userToAdd: AddMemberFields = {
				userId: contact.id,
				owner: false,
				historyCleared: !showHistory
			};
			RoomsApi.addRoomMember(roomId, userToAdd).then(() => closeModal());
		});
	}, [closeModal, contactsSelected, roomId, showHistory]);

	const addMemberDisabled = useMemo(
		() => maxMembers === members?.length,
		[maxMembers, members?.length]
	);

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
				actionTestId="leaveActionButton"
			/>
			{addNewMemberModalOpen && (
				<AddNewMemberModal
					addNewMemberModalOpen={addNewMemberModalOpen}
					addNewMember={addNewMember}
					closeModal={closeModal}
					members={members}
					contactsSelected={contactsSelected}
					setContactSelected={setContactsSelected}
					showHistory={showHistory}
					setShowHistory={setShowHistory}
					label={roomName}
				/>
			)}
		</Container>
	);
};

export default AddNewMemberAction;
