/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const calculateAvatarColor = (label: string): string => {
	let sum = 0;
	// eslint-disable-next-line no-plusplus
	for (let i = 0; i < label.length; i++) {
		sum += label.charCodeAt(i);
	}
	return `avatar_${(sum % 50) + 1}`;
};
