/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { getRoomIsWritingList } from '../store/selectors/ActiveConversationsSelectors';
import useStore from '../store/Store';

export const useIsWritingLabel = (
	roomId: string,
	isInsideSidebar?: boolean
): string | undefined => {
	const [t] = useTranslation();
	const isTypingLabel = t('status.isTyping', 'is typing...');
	const areTypingLabel = t('status.areTyping', 'are typing...');

	const writingListNames = useStore((state) => getRoomIsWritingList(state, roomId));

	if (writingListNames === undefined || writingListNames?.length === 0) return undefined;
	if (writingListNames?.length === 1) {
		return isInsideSidebar
			? `${writingListNames[0].split(/(\s+)/)[0]} ${isTypingLabel}`
			: `${writingListNames.toString()} ${isTypingLabel}`;
	}
	const usersWritingListNames: string[] = [];
	map(writingListNames, (user) => {
		usersWritingListNames.push(user.split(/(\s+)/)[0]);
	});
	return isInsideSidebar
		? `${usersWritingListNames.join(', ')} ${areTypingLabel}`
		: `${writingListNames?.join(', ')} ${areTypingLabel}`;
};
