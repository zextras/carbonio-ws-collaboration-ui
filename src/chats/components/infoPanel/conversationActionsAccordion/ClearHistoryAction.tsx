/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Container,
	SnackbarManagerContext,
	CreateSnackbarFn
} from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import ClearHistoryModal from './ClearHistoryModal';
import { RoomType } from '../../../../types/store/RoomTypes';

type ClearHistoryProps = {
	roomId: string;
	roomType?: string;
	isInsideMeeting?: boolean;
	iAmTheOnlyOwner?: boolean;
};

type CreateSnackbarFn = typeof CreateSnackbarFn;

const ClearHistoryAction: FC<ClearHistoryProps> = ({
	roomId,
	roomType,
	isInsideMeeting,
	iAmTheOnlyOwner
}) => {
	const [t] = useTranslation();
	const clearHistoryLabel = t('action.clearHistory', 'Clear history');
	const historyClearedLabel = t('feedback.historyCleared', 'History cleared successfully!');

	const [clearHistoryModalOpen, setClearHistoryModalOpen] = useState<boolean>(false);

	const padding = useMemo(
		() =>
			roomType === RoomType.GROUP
				? iAmTheOnlyOwner && isInsideMeeting
					? { top: 'small', bottom: 'large' }
					: { top: 'small' }
				: { top: 'small', bottom: 'large' },
		[iAmTheOnlyOwner, isInsideMeeting, roomType]
	);

	const openModal = useCallback(() => setClearHistoryModalOpen(true), []);

	const closeModal = useCallback(() => setClearHistoryModalOpen(false), []);

	const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);
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
				padding={padding}
				label={clearHistoryLabel}
				withArrow
				action={openModal}
				isInsideMeeting={isInsideMeeting}
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