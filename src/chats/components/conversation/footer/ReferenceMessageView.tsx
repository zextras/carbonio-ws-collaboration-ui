/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import MessageReferenceDisplayed from './MessageReferenceDisplayed';
import { getReferenceMessage } from '../../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../../store/Store';
import { messageActionType } from '../../../../types/store/ActiveConversationTypes';

type ReferenceMessageViewProps = {
	roomId: string;
};

const ReferenceMessageView: React.FC<ReferenceMessageViewProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const closeTooltip = t('tooltip.close', 'Close');
	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));
	const unsetReferenceMessage = useStore((store) => store.unsetReferenceMessage);
	const setDraftMessage = useStore((store) => store.setDraftMessage);

	const closeReferenceView = useCallback(() => {
		if (referenceMessage?.actionType === messageActionType.EDIT) {
			setDraftMessage(roomId, true);
		}
		unsetReferenceMessage(roomId);
	}, [roomId, unsetReferenceMessage, referenceMessage, setDraftMessage]);

	if (referenceMessage) {
		return (
			<Container
				orientation="horizontal"
				mainAlignment="flex-start"
				background="gray5"
				padding={{ vertical: 'medium', left: 'medium' }}
				data-testid="reference_message"
			>
				<MessageReferenceDisplayed referenceMessage={referenceMessage} />
				<Tooltip label={closeTooltip} placement="right">
					<Container mainAlignment="flex-start" padding={{ right: 'small' }} width="2.5rem">
						<IconButton
							icon="Close"
							iconColor="secondary"
							size="medium"
							onClick={closeReferenceView}
						/>
					</Container>
				</Tooltip>
			</Container>
		);
	}
	return null;
};

export default ReferenceMessageView;
