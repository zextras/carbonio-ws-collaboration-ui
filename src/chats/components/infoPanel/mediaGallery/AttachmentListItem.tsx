/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Text, Tooltip } from '@zextras/carbonio-design-system';

import { Attachment } from '../../../../types/network/models/attachmentTypes';

type AttachmentListItemProps = {
	attachment: Attachment;
};

export const AttachmentListItem: FC<AttachmentListItemProps> = ({ attachment }) => (
	<Container
		data-testid={`mediaGalleryAttachment-${attachment.id}`}
		orientation="horizontal"
		mainAlignment="flex-start"
		padding={{ horizontal: 'small', vertical: 'extrasmall' }}
		minHeight="2.75rem"
	>
		<Tooltip overflowTooltip label={attachment.name}>
			<Text size="small" overflow="ellipsis">
				{attachment.name}
			</Text>
		</Tooltip>
	</Container>
);
