/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

import { Room } from '../../types/store/RoomTypes';

export const roomMainInfoEqualityFn = (oldState: Room, newState: Room): boolean =>
	oldState?.name === newState?.name &&
	oldState?.description === newState?.description &&
	oldState?.type === newState?.type &&
	oldState?.id === newState?.id;

export const roomNameEqualityFn = (oldState: string, newState: string): boolean =>
	oldState === newState;

export const roomsListLengthEqualityFn = (
	oldState: Record<any, any>,
	newState: Record<any, any>
): boolean => size(oldState) === size(newState);

export const roomMessagesEqualityFn = (
	oldState: Record<any, any>,
	newState: Record<any, any>
): boolean => oldState.length === newState.length;
