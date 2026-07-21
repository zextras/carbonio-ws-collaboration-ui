/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const buildQueryString = (
	params: Record<string, string | number | boolean | undefined | null>
): string => {
	const searchParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null) searchParams.append(key, String(value));
	});
	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : '';
};
