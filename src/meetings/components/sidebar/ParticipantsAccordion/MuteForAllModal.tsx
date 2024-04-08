/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type muteForAllModalProps = {
	isOpen: boolean;
	closeModal: () => void;
	muteForAll: () => void;
};

const MuteForAllModal: FC<muteForAllModalProps> = ({ isOpen, closeModal, muteForAll }) => {
	const [t] = useTranslation();

	const muteForAllLabel = t('tooltip.muteForAll', 'Mute for all');
	const closeLabel = t('action.close', 'Close');
	const muteForAllDescription = t(
		'modal.muteForAllDescription',
		'By muting the user, all participants will no longer hear the user. Only the muted user can unmute. Proceed?'
	);

	const muteForAllAction = useCallback(() => {
		muteForAll();
		closeModal();
	}, [closeModal, muteForAll]);

	return (
		<Modal
			open={isOpen}
			onConfirm={muteForAllAction}
			title={muteForAllLabel}
			confirmLabel={muteForAllLabel}
			confirmColor="error"
			showCloseIcon
			onClose={closeModal}
			closeIconTooltip={closeLabel}
			data-testid="mute_for_all_modal"
		>
			<Container padding={{ vertical: 'large' }}>
				<Text overflow="break-word">{muteForAllDescription}</Text>
			</Container>
		</Modal>
	);
};

export default MuteForAllModal;
