/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Padding, Shimmer } from '@zextras/carbonio-design-system';

type AttachmentListSkeletonProps = {
	rows?: number;
};

export const AttachmentListSkeleton: FC<AttachmentListSkeletonProps> = ({ rows = 8 }) => (
	<Container
		data-testid="mediaGallerySkeleton"
		mainAlignment="flex-start"
		crossAlignment="stretch"
		padding={{ all: 'small' }}
	>
		{Array.from({ length: rows }, (_, index) => (
			<Padding key={index} bottom="small" width="100%">
				<Shimmer.Text width="100%" height="2rem" />
			</Padding>
		))}
	</Container>
);
