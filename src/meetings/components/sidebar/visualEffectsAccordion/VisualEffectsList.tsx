/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';

import { Container, Icon, Text } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import useVirtualBackground from '../../../../hooks/useVirtualBackground';
import { getBackgroundImage } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';
import { VirtualBackgroundType } from '../../../../types/store/ActiveMeetingTypes';
import { getBackgroundChunks } from '../../../../utils/MeetingsUtils';

type VisualEffectCardsProps = {
	meetingId: string;
};

const PictureContainer = styled(Container)<{ $picture?: string | false; $isSelected: boolean }>`
	background-size: cover;
	background-position: center;
	aspect-ratio: 1.2959;
	border-radius: 0.5rem;
	${({ $isSelected, theme }): string | false =>
		$isSelected && `border: 1px solid ${theme.palette.success.regular};`}
	${({ $picture, theme }): string =>
		$picture
			? `background-image: url(${$picture});`
			: `background-color: ${theme.palette.gray0.regular}`};
`;

const ListContainer = styled(Container)`
	overflow-y: scroll;
`;

const VisualEffectsList: FC<VisualEffectCardsProps> = ({ meetingId }) => {
	const setBackgroundImage = useStore((store) => store.setBackgroundImage);
	const backgroundSelected = useStore((store) => getBackgroundImage(store, meetingId));

	const { virtualBackgroundImages } = useVirtualBackground();

	const changeBackground = useCallback(
		(type: VirtualBackgroundType) => {
			setBackgroundImage(meetingId, type);
		},
		[meetingId, setBackgroundImage]
	);

	const rowsToRender = useMemo(() => {
		const gridArray: React.ReactNode[] = [];
		const chunks = getBackgroundChunks();

		chunks.forEach((chunk, i) => {
			const rowBackgrounds: React.ReactNode[] = chunk.map((element) => {
				if (element === 'placeholder') {
					return (
						<Container
							key={`placeholder-${i}-${element}`}
							minHeight="5.176rem"
							maxHeight="7.267rem"
							minWidth="6.5rem"
							maxWidth="9.25rem"
						/>
					);
				}

				const isBlurOrNone =
					element === VirtualBackgroundType.BLUR || element === VirtualBackgroundType.NONE;

				const isSelected = element === backgroundSelected;

				return (
					<Container
						key={`background-${i}-${element}`}
						mainAlignment="flex-start"
						crossAlignment="flex-start"
					>
						<PictureContainer
							minHeight="5.176rem"
							maxHeight="7.267rem"
							minWidth="6.5rem"
							maxWidth="9.25rem"
							onClick={() => changeBackground(element)}
							$picture={isBlurOrNone ? false : virtualBackgroundImages[element]}
							$isSelected={isSelected}
						>
							{isBlurOrNone && (
								<Icon icon={element === VirtualBackgroundType.BLUR ? 'Blur' : 'Slash'} />
							)}
							{isBlurOrNone && <Text>{element}</Text>}
						</PictureContainer>
					</Container>
				);
			});

			gridArray.push(
				<Container
					key={`row-${i}`}
					orientation="horizontal"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					height="fit"
					gap="0.5rem"
					padding={{ top: '0.5rem', right: '0.5rem' }}
				>
					{rowBackgrounds}
				</Container>
			);
		});

		return gridArray;
	}, [backgroundSelected, changeBackground, virtualBackgroundImages]);

	return (
		<ListContainer minHeight="21.313rem" mainAlignment="flex-start" crossAlignment="flex-start">
			{rowsToRender}
		</ListContainer>
	);
};
export default VisualEffectsList;
