/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../models/attachmentTypes';

export type DeleteAttachmentResponse = Response;

export type GetAttachmentInfoResponse = Attachment;

export type GetAttachmentResponse = Blob;

export type GetImageResponse = Blob;

export type GetPdfResponse = Response;

export type GetImageThumbnailResponse = Blob;

export type GetPdfThumbnailResponse = Response;

export type ImageSize = { width: number; height: number };
