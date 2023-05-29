/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import AddNewMemberModal from './AddNewMemberModal';
import { RoomsApi } from '../../../network';
import { getRoomMembers, getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { AddMemberFields } from '../../../types/network/models/roomBeTypes';
import { AddRoomMemberResponse } from '../../../types/network/responses/roomsResponses';
import { Member } from '../../../types/store/RoomTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';
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
	const addRoomMember = useStore((state) => state.addRoomMember);
	const maxMembers = useStore((store) => getCapability(store, CapabilityType.MAX_GROUP_MEMBERS));

	const [contactsSelected, setContactSelected] = useState<ContactSelected>({});
	const [addNewMemberModalOpen, setAddNewMemberModalOpen] = useState<boolean>(false);

	const [showHistory, setShowHistory] = useState<boolean>(false);

	const closeModal = useCallback(() => {
		setAddNewMemberModalOpen(false);
		setContactSelected({});
	}, []);

	const addNewMember = useCallback(() => {
		map(contactsSelected, (contact) => {
			const userToAdd: AddMemberFields = {
				userId: contact.id,
				owner: false,
				historyCleared: !showHistory
			};
			RoomsApi.addRoomMember(roomId, userToAdd)
				.then((response: AddRoomMemberResponse) => {
					addRoomMember(roomId, response);
					closeModal();
				})
				.catch();
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [contactsSelected, roomId, showHistory]);

	const addMemberDisabled = useMemo(
		() => maxMembers === members?.length,
		[maxMembers, members?.length]
	);

	return (
		<Container>
			<ActionComponent
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
					setContactSelected={setContactSelected}
					showHistory={showHistory}
					setShowHistory={setShowHistory}
					label={roomName}
				/>
			)}
		</Container>
	);
};

export default AddNewMemberAction;
