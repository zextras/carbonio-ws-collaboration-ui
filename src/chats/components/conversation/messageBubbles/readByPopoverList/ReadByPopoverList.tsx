/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { useTranslation } from 'react-i18next';

import { getUsersReadingMessage } from '../../../../../store/selectors/MarkersSelectors';
import useStore from '../../../../../store/Store';
import UserPopoverList from '../../../userPopoverList/UserPopoverList';

type ReadByProps = {
	roomId: string;
	stanzaId: string;
	anchorRef: React.RefObject<HTMLElement>;
};
const ReadByPopoverList = ({ roomId, stanzaId, anchorRef }: ReadByProps): ReactElement => {
	const [t] = useTranslation();
	const seenByLabel = t('readBy.title', 'Seen by:');

	const readingUsers = useStore((store) => getUsersReadingMessage(store, roomId, stanzaId));

	return (
		<UserPopoverList
			anchorEl={anchorRef}
			userList={readingUsers}
			title={seenByLabel}
			icon="DoneAll"
			iconColor="primary"
			displayPresence
		/>
	);
};

export default ReadByPopoverList;
