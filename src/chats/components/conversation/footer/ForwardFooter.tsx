/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Button, Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getForwardList } from '../../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../../store/Store';
import ForwardMessageModal from '../forwardModal/ForwardMessageModal';

type ForwardFooterProps = {
	roomId: string;
};

const ForwardFooter: FC<ForwardFooterProps> = ({ roomId }) => {
	const [t] = useTranslation();

	const exitSelectionMode = t('conversation.selectionMode.exit', 'Exit Selection Mode');
	const forward = t('action.forward', 'Forward');

	const forwardMessageList = useStore((store) => getForwardList(store, roomId));
	const unsetForwardList = useStore((store) => store.unsetForwardMessageList);

	const [forwardMessageModalIsOpen, setForwardMessageModalIsOpen] = useState<boolean>(false);

	const forwardMessagesCounter = useMemo(() => {
		if (forwardMessageList === undefined) return 0;
		return forwardMessageList.length;
	}, [forwardMessageList]);
	const multipleForward = t(
		'conversation.selectionMode.multipleForward',
		`forward ${forwardMessagesCounter} messages`,
		{
			numberOfMessages: forwardMessagesCounter
		}
	);

	const forwardLabel = useMemo(() => {
		if (forwardMessagesCounter === 1) return forward;
		return multipleForward;
	}, [forward, forwardMessagesCounter, multipleForward]);

	const handleUnsetForwardMode = useCallback(() => {
		unsetForwardList(roomId);
	}, [roomId, unsetForwardList]);

	const onCloseForwardMessageModal = useCallback(() => {
		unsetForwardList(roomId);
		setForwardMessageModalIsOpen(false);
	}, [roomId, unsetForwardList]);

	const onOpenForwardMessageModal = useCallback(() => {
		setForwardMessageModalIsOpen(true);
	}, []);

	return (
		<Container
			height="3.25rem"
			orientation="horizontal"
			mainAlignment="space-between"
			padding={{ all: 'small' }}
			background={'gray5'}
		>
			<Button
				type="ghost"
				label={exitSelectionMode}
				icon="ArrowBackOutline"
				iconPlacement="left"
				color="secondary"
				onClick={handleUnsetForwardMode}
			/>
			<Button
				type="ghost"
				label={forwardLabel}
				icon="Forward"
				iconPlacement="right"
				color="secondary"
				onClick={onOpenForwardMessageModal}
			/>
			{forwardMessageModalIsOpen && (
				<ForwardMessageModal
					open={forwardMessageModalIsOpen}
					onClose={onCloseForwardMessageModal}
					roomId={roomId}
					messagesToForward={forwardMessageList}
				/>
			)}
		</Container>
	);
};

export default ForwardFooter;
