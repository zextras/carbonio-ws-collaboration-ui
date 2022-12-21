/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const messageWhereScrollIsStoppedEqualityFn = (
	oldState: string | undefined,
	newState: string | undefined
): boolean => oldState === newState;
