/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, Divider, List, Spinner } from '@zextras/carbonio-design-system';

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
		const rows = groups.flatMap((group, index) => {
			const groupRows: Array<React.JSX.Element> = [
				<AttachmentMonthHeader key={`header-${group.key}`} label={group.label} />,
				...group.items.map((attachment) => (
					<AttachmentListItem key={attachment.id} attachment={attachment} />
				))
			];
			if (index > 0) {
				groupRows.unshift(
					<Divider
						key={`divider-${group.key}`}
						data-testid={`mediaGalleryMonthDivider-${group.key}`}
						color="gray3"
						style={{ marginInline: '0.5rem', width: 'auto' }}
					/>
				);
			}
			return groupRows;
		});
		if (isLoading && hasMore) {
			rows.push(
				<Container key="load-more-spinner" padding={{ all: 'small' }} mainAlignment="center">
					<Spinner color="gray1" />
				</Container>
			);
		}
		return rows;
	}, [attachments, isLoading, hasMore]);

	return (
		<List
			data-testid="mediaGalleryList"
			onListBottom={hasMore ? loadMore : undefined}
			height="100%"
		>
			{items}
		</List>
	);
};
