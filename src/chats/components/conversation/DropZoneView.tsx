/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Icon, Text, Padding } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const BackDropLayout = styled(Container)`
	width: 100%;
	position: absolute;
	height: 100%;
	z-index: 100;
	top: 0;
	left: 0;
`;

const DropBackground = styled(Container)`
	width: calc(100% - 0.625rem);
	background: ${(props): string => props.theme.palette.primary.regular}80;
	height: calc(100% - 0.625rem);
	border-radius: 0.25rem;
	left: 0.3125rem;
	pointer-events: none;
`;

const BackDropLayoutInnerBox = styled(Container)`
	background: ${(props): string => props.theme.palette.gray6.regular};
	border-radius: 0.625rem;
	min-height: 11.25rem;
	max-width: 23.75rem;
	max-height: 13.125rem;
`;

const BackDropLayoutContentBox = styled(Container)`
	border-style: dashed;
	border-width: 0.125rem;
	border-radius: 0.3125rem;
	border-color: ${(props): string => props.theme.palette.primary.regular};
	box-sizing: border-box;
	padding: 2.5rem;
`;

const DropBoxIconGroup = styled(Container)`
	margin-bottom: 0.5rem;
	height: 2.5rem;
`;

const DetailText = styled(Text)`
	text-align: center;
`;

const CustomIcon = styled(Icon)`
	height: 2.625rem;
	width: 2.625rem;
`;

const CustomIcon2 = styled(Icon)`
	height: 2rem;
	width: 2rem;
`;

type DropZoneAttachmentType = {
	onDropEvent: (event: React.DragEvent<HTMLElement>) => void;
	onDragOverEvent: (event: React.DragEvent<HTMLElement>) => void;
	onDragLeaveEvent: (event: React.DragEvent<HTMLElement> | DragEvent) => void;
};

const DropZoneView = ({
	onDragOverEvent,
	onDropEvent,
	onDragLeaveEvent
}: DropZoneAttachmentType): ReactElement => {
	const [t] = useTranslation();
	const dragAndDropLabel = t('attachments.dragAndDrop', 'Drag&Drop mode');
	const dropHereDescriptionLabel = t(
		'attachments.dropHereDescription',
		'Drop here your attachments to quickly add them to this Chat'
	);

	return (
		<BackDropLayout
			data-testid="dropZoneView"
			onDragOver={onDragOverEvent}
			onDrop={onDropEvent}
			onDragLeave={onDragLeaveEvent}
			borderRadius="half"
		>
			<DropBackground>
				<BackDropLayoutInnerBox padding={{ all: 'medium' }}>
					<BackDropLayoutContentBox>
						<Container mainAlignment="center">
							<DropBoxIconGroup mainAlignment="center" orientation="horizontal">
								<Padding right="small" left="small">
									<CustomIcon2 icon="ImageOutline" height="2rem" width="2rem" color="primary" />
								</Padding>
								<Padding right="small" left="small">
									<CustomIcon
										icon="FileAddOutline"
										height="2.625rem"
										width="2.625rem"
										color="primary"
									/>
								</Padding>
								<Padding right="small" left="small">
									<CustomIcon2 icon="FilmOutline" height="2rem" width="2rem" color="primary" />
								</Padding>
							</DropBoxIconGroup>
							<Container mainAlignment="center" height="auto">
								<Text color="primary" weight="bold">
									{dragAndDropLabel}
								</Text>
								<Padding top="small" />
								<DetailText size="medium" weight="regular" color="primary" overflow="break-word">
									{dropHereDescriptionLabel}
								</DetailText>
							</Container>
						</Container>
					</BackDropLayoutContentBox>
				</BackDropLayoutInnerBox>
			</DropBackground>
		</BackDropLayout>
	);
};

export default DropZoneView;
