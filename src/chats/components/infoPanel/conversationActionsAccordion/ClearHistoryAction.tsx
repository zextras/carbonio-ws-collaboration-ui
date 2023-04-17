/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import ClearHistoryModal from './ClearHistoryModal';

type ClearHistoryProps = {
	roomId: string;
};

const ClearHistoryAction: FC<ClearHistoryProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const clearHistoryLabel = t('action.clearHistory', 'Clear History');
	const historyClearedLabel = t('feedback.historyCleared', 'History cleared successfully!');

	const [clearHistoryModalOpen, setClearHistoryModalOpen] = useState<boolean>(false);

	const openModal = useCallback(() => setClearHistoryModalOpen(true), []);

	const closeModal = useCallback(() => setClearHistoryModalOpen(false), []);

	const createSnackbar: any = useContext(SnackbarManagerContext);
	const successfulSnackbar = useCallback(
		() =>
			createSnackbar({
				key: new Date().toLocaleString(),
				type: 'success',
				label: historyClearedLabel,
				hideButton: true
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	return (
		<Container>
			<ActionComponent
				icon="BookOpenOutline"
				actionColor="error"
				padding={{ top: 'small' }}
				label={clearHistoryLabel}
				withArrow
				action={openModal}
			/>
			{clearHistoryModalOpen && (
				<ClearHistoryModal
					roomId={roomId}
					clearHistoryModalOpen={clearHistoryModalOpen}
					closeModal={closeModal}
					successfulSnackbar={successfulSnackbar}
				/>
			)}
		</Container>
	);
};

export default ClearHistoryAction;
