/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container, CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import ClearHistoryModal from './ClearHistoryModal';
import { RoomType } from '../../../../types/store/RoomTypes';

type ClearHistoryProps = {
	roomId: string;
	roomType?: string;
};

const ClearHistoryAction: FC<ClearHistoryProps> = ({ roomId, roomType }) => {
	const [t] = useTranslation();
	const clearHistoryLabel = t('action.clearHistory', 'Clear history');
	const historyClearedLabel = t('feedback.historyCleared', 'History cleared successfully!');

	const [clearHistoryModalOpen, setClearHistoryModalOpen] = useState<boolean>(false);

	const padding = useMemo(() => {
		if (roomType !== RoomType.GROUP) return { top: 'small', bottom: 'large' };
		return { top: 'small' };
	}, [roomType]);

	const openModal = useCallback(() => setClearHistoryModalOpen(true), []);

	const closeModal = useCallback(() => setClearHistoryModalOpen(false), []);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const successfulSnackbar = useCallback(
		() =>
			createSnackbar({
				key: new Date().toLocaleString(),
				severity: 'success',
				label: historyClearedLabel,
				hideButton: true
			}),
		[createSnackbar, historyClearedLabel]
	);

	return (
		<Container>
			<ActionComponent
				icon="BookOpenOutline"
				actionColor="error"
				padding={padding}
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
