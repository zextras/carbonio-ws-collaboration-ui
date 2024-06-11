/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { useTheme } from '@zextras/carbonio-design-system';

import { UsersApi } from '../network';
import {
	getAreUserInfoAvailable,
	getIsUserGuest,
	getUserName,
	getUserPictureUpdatedAt
} from '../store/selectors/UsersSelectors';
import useStore from '../store/Store';
import { calcAvatarMeetingColor, calculateAvatarColor } from '../utils/styleUtils';

const useAvatarUtilities = (
	userId: string,
	onMeeting?: boolean
): { avatarColor: string; avatarPicture: string; avatarIcon: string | undefined } => {
	const areUserInfoAvailable = useStore((store) => getAreUserInfoAvailable(store, userId));
	const userName: string = useStore((store) => getUserName(store, userId));
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, userId)
	);
	const isUserGuest = useStore((store) => getIsUserGuest(store, userId));

	const themeColor = useTheme();

	const color = useMemo(() => {
		const color = calculateAvatarColor(userName);
		if (!areUserInfoAvailable) return `#828282`;
		if (onMeeting) return calcAvatarMeetingColor(themeColor.avatarColors[color]);
		return `${themeColor.avatarColors[color]}`;
	}, [userName, areUserInfoAvailable, themeColor.avatarColors, onMeeting]);

	const picture = useMemo(() => {
		if (userPictureUpdatedAt)
			return `${UsersApi.getURLUserPicture(userId)}?${userPictureUpdatedAt}`;
		return '';
	}, [userId, userPictureUpdatedAt]);

	const icon = useMemo(() => {
		if (!areUserInfoAvailable) return 'QuestionMarkCircleOutline';
		if (isUserGuest) return 'SmileOutline';
		return undefined;
	}, [areUserInfoAvailable, isUserGuest]);

	return {
		avatarColor: color,
		avatarPicture: picture,
		avatarIcon: icon
	};
};
export default useAvatarUtilities;
