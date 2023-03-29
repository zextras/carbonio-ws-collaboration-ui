/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { UserBe } from '../models/userBeTypes';

export type GetUserResponse = UserBe;

export type GetUsersResponse = UserBe[];

export type GetUserPictureResponse = Blob;

export type ChangeUserPictureResponse = Response;

export type DeleteUserPictureResponse = Response;
