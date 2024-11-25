/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, SetStateAction } from 'react';

import { Button } from '@zextras/carbonio-design-system';

import CreateVirtualRoomModal from './CreateVirtualRoomModal';

type CreateVirtualRoomButtonProps = {
	toggleModal: () => void;
	showCreationModal: boolean;
	setShowCreationModal: Dispatch<SetStateAction<boolean>>;
	createModalRef: React.RefObject<HTMLDivElement>;
};

const CreateVirtualRoomButton: FC<CreateVirtualRoomButtonProps> = ({
	toggleModal,
	showCreationModal,
	setShowCreationModal,
	createModalRef
}) => (
	<>
		<Button label="Create new Room" color="primary" width="fill" onClick={toggleModal} />
		<CreateVirtualRoomModal
			toggleModal={toggleModal}
			showCreationModal={showCreationModal}
			setShowCreationModal={setShowCreationModal}
			createModalRef={createModalRef}
		/>
	</>
);

export default CreateVirtualRoomButton;
