/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Room } from '../../types/store/RoomTypes';

export const roomMainInfoEqualityFn = (oldState: Room, newState: Room): boolean =>
	oldState?.name === newState?.name &&
	oldState?.description === newState?.description &&
	oldState?.type === newState?.type &&
	oldState?.id === newState?.id;
