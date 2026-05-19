/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';

type AttachmentMonthHeaderProps = {
	label: string;
};

export const AttachmentMonthHeader: FC<AttachmentMonthHeaderProps> = ({ label }) => (
	<Container
		data-testid={`mediaGalleryMonthHeader-${label}`}
		mainAlignment="center"
		padding={{ vertical: 'small' }}
		height="fit"
	>
		<Text size="small" color="gray1">
			{label}
		</Text>
	</Container>
);
