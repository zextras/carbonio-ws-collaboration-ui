/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, List, ListItem, Spinner } from '@zextras/carbonio-design-system';

import { AttachmentListItem } from './AttachmentListItem';
import { AttachmentMonthHeader } from './AttachmentMonthHeader';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import { groupAttachmentsByMonth } from '../../../../utils/mediaGalleryUtils';

type AttachmentListProps = {
	attachments: Array<Attachment>;
	hasMore: boolean;
	isLoading: boolean;
	loadMore: () => void;
};

export const AttachmentList: FC<AttachmentListProps> = ({
	attachments,
	hasMore,
	isLoading,
	loadMore
}) => {
	const items = useMemo(() => {
		const groups = groupAttachmentsByMonth(attachments);
		const rows = groups.flatMap((group) => [
			<ListItem key={`header-${group.key}`}>
				{(_isVisible) => <AttachmentMonthHeader label={group.label} />}
			</ListItem>,
			...group.items.map((attachment) => (
				<ListItem key={attachment.id}>
					{(_isVisible) => <AttachmentListItem attachment={attachment} />}
				</ListItem>
			))
		]);
		if (isLoading && hasMore) {
			rows.push(
				<ListItem key="load-more-spinner">
					{() => (
						<Container padding={{ all: 'small' }} mainAlignment="center">
							<Spinner color="gray1" />
						</Container>
					)}
				</ListItem>
			);
		}
		return rows;
	}, [attachments, isLoading, hasMore]);

	return (
		<List
			data-testid="mediaGalleryList"
			onListBottom={hasMore ? loadMore : undefined}
			// month headers are inert items; CDS keyboard nav would land on them oddly
			keyboardShortcutsIsDisabled
			height="100%"
		>
			{items}
		</List>
	);
};
