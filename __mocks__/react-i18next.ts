/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const useTranslation: () => { t: (str: string) => string } = () => ({
	t: (str: string): string => str
});
