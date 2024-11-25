/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	ACTION_TYPES,
	NewAction,
	registerActions,
	removeActions
} from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { CHATS_APP_ID } from '../../constants/appConstants';
import CreateVirtualRoomModal from './secondaryBar/virtualRoomWidget/CreateVirtualRoomModal';

const RegisterVirtualRoomCreationButton = (): ReactElement => {
	const [t] = useTranslation();
	const createVirtualLabel = 'create-virtual';

	const [showCreationModal, setShowCreationModal] = useState(false);

	const createModalRef = useRef<HTMLDivElement>(null);

	const newAction = useMemo(
		(): NewAction => ({
			id: createVirtualLabel,
			label: t('action.newVirtual', 'New Virtual Room'),
			icon: 'WscOutline',
			execute: (): void => setShowCreationModal(true),
			group: CHATS_APP_ID,
			primary: true
		}),
		[t]
	);

	const toggleModal = useCallback(() => {
		setShowCreationModal((prevState) => !prevState);
	}, []);

	useEffect(() => {
		registerActions<NewAction>({
			id: createVirtualLabel,
			type: ACTION_TYPES.NEW,
			action: () => newAction
		});
		return (): void => removeActions(createVirtualLabel);
	}, [newAction, t]);

	return (
		<CreateVirtualRoomModal
			toggleModal={toggleModal}
			showCreationModal={showCreationModal}
			setShowCreationModal={setShowCreationModal}
			createModalRef={createModalRef}
		/>
	);
};

export default RegisterVirtualRoomCreationButton;
