/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, List, Spinner, useIsVisible } from '@zextras/carbonio-design-system';

import { AttachmentGridTile } from './AttachmentGridTile';
import { AttachmentMonthHeader } from './AttachmentMonthHeader';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import { groupAttachmentsByMonth } from '../../../../utils/mediaGalleryUtils';

const GRID_COLUMNS = 4;
const GRID_GAP = '0.125rem';

function chunkAttachments(attachments: Array<Attachment>, size: number): Array<Array<Attachment>> {
	const rows: Array<Array<Attachment>> = [];
	for (let index = 0; index < attachments.length; index += size) {
		rows.push(attachments.slice(index, index + size));
	}
	return rows;
}

type AttachmentGridRowProps = {
	attachments: Array<Attachment>;
	listRef?: React.RefObject<HTMLDivElement>;
};

const AttachmentGridRow: FC<AttachmentGridRowProps> = ({ attachments, listRef }) => {
	const [visible, rowRef] = useIsVisible<HTMLDivElement>(listRef);
	return (
		<Container
			ref={rowRef}
			data-testid={`mediaGalleryGridRow-${attachments[0].id}`}
			orientation="horizontal"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			height="fit"
			gap={GRID_GAP}
			padding={{ horizontal: '0.5rem', bottom: GRID_GAP }}
		>
			{attachments.map((attachment) => (
				<AttachmentGridTile key={attachment.id} attachment={attachment} visible={visible} />
			))}
		</Container>
	);
};

type AttachmentGridProps = {
	attachments: Array<Attachment>;
	hasMore: boolean;
	isLoading: boolean;
	loadMore: () => void;
};

export const AttachmentGrid: FC<AttachmentGridProps> = ({
	attachments,
	hasMore,
	isLoading,
	loadMore
}) => {
	const items = useMemo(() => {
		const groups = groupAttachmentsByMonth(attachments);
		const rows = groups.flatMap((group) => [
			<AttachmentMonthHeader key={`header-${group.key}`} label={group.label} />,
			...chunkAttachments(group.items, GRID_COLUMNS).map((row) => (
				<AttachmentGridRow key={`row-${group.key}-${row[0].id}`} attachments={row} />
			))
		]);
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
			data-testid="mediaGalleryGrid"
			onListBottom={hasMore ? loadMore : undefined}
			height="100%"
		>
			{items}
		</List>
	);
};
