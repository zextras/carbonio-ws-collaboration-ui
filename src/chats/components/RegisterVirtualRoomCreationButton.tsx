/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useRef, useState } from 'react';

import {
	ACTION_TYPES,
	NewAction,
	registerActions,
	removeActions
} from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { CHATS_APP_ID } from '../../constants/appConstants';
import CreateVirtualRoomModal from './secondaryBar/virtualRoomWidget/CreateVirtualRoomModal';
import { getAttribute } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';

const RegisterVirtualRoomCreationButton = (): ReactElement => {
	const [t] = useTranslation();
	const createVirtualLabel = 'create-virtual';

	const [showCreationModal, setShowCreationModal] = useState(false);

	const videoCallEnabled = useStore((store) => getAttribute(store, 'videoCallEnabled'));

	const createModalRef = useRef<HTMLDivElement>(null);

	const newAction = useMemo(
		(): NewAction => ({
			id: createVirtualLabel,
			label: t('action.newVirtual', 'New Virtual Room'),
			icon: 'VideoOutline',
			execute: (): void => setShowCreationModal(true),
			group: CHATS_APP_ID,
			primary: true
		}),
		[t]
	);

	useEffect(() => {
		if (videoCallEnabled) {
			registerActions<NewAction>({
				id: createVirtualLabel,
				type: ACTION_TYPES.NEW,
				action: () => newAction
			});
		}
		return (): void => removeActions(createVirtualLabel);
	}, [newAction, t, videoCallEnabled]);

	return (
		<CreateVirtualRoomModal
			open={showCreationModal}
			onClose={() => setShowCreationModal(false)}
			createModalRef={createModalRef}
		/>
	);
};

export default RegisterVirtualRoomCreationButton;
