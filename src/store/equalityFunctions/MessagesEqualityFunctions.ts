/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isEqual } from 'lodash';

export const roomsListSecondaryBarLengthEqualityFn = (
	oldState: { roomId: string; lastMessageTimestamp: number }[],
	newState: { roomId: string; lastMessageTimestamp: number }[]
): boolean => isEqual(oldState, newState);
