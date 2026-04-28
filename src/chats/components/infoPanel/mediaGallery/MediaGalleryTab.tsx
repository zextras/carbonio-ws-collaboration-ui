/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';

type MediaGalleryTabProps = {
	roomId: string;
};

export const MediaGalleryTab: FC<MediaGalleryTabProps> = () => (
	<Container data-testid="mediaGalleryTab" mainAlignment="flex-start" />
);
