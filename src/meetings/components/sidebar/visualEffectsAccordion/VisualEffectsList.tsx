/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { Container, Icon, Text } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useVirtualBackground from '../../../../hooks/useVirtualBackground';
import { getBackgroundImage } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';
import { VirtualBackgroundType } from '../../../../types/store/ActiveMeetingTypes';

type VisualEffectCardsProps = {
	meetingId: string;
};

const PictureContainer = styled(Container)<{ $picture?: string | false; $isSelected: boolean }>`
	background-size: cover;
	background-position: center;
	aspect-ratio: 1.2959;
	border-radius: 0.5rem;
	${({ $isSelected, theme }): string | false =>
		$isSelected && `outline: 2px solid ${theme.palette.success.active};`}
	${({ $isSelected }): string | false => !$isSelected && `opacity: 0.6;`}
	${({ $picture, theme }): string =>
		$picture
			? `background-image: url(${$picture});`
			: `background-color: ${theme.palette.gray0.regular}`};
`;

const ListContainer = styled(Container)`
	overflow-y: scroll;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
`;

const VisualEffectsList: FC<VisualEffectCardsProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const setBackgroundImage = useStore((store) => store.setBackgroundImage);
	const backgroundSelected = useStore((store) => getBackgroundImage(store, meetingId));

	const { virtualBackgroundImages } = useVirtualBackground();

	const backgroundTiles = useMemo(
		() =>
			map(VirtualBackgroundType, (element) => {
				const isBlurOrNone =
					element === VirtualBackgroundType.BLUR || element === VirtualBackgroundType.NONE;
				const isSelected = element === backgroundSelected;

				const changeBackground = (): void => {
					setBackgroundImage(meetingId, element);
				};

				const elementLabel =
					element === VirtualBackgroundType.BLUR
						? t('meeting.visualEffects.blur', 'Blur')
						: t('meeting.visualEffects.none', 'None');

				return (
					<PictureContainer
						key={`background-${element}`}
						minHeight="5.176rem"
						maxHeight="7.267rem"
						minWidth="6.5rem"
						maxWidth="9.25rem"
						onClick={changeBackground}
						data-testid={`${element}`}
						$picture={isBlurOrNone ? false : virtualBackgroundImages[element]}
						$isSelected={isSelected}
						gap="0.5rem"
					>
						{isBlurOrNone && (
							<Icon size="large" icon={element === VirtualBackgroundType.BLUR ? 'Blur' : 'Slash'} />
						)}
						{isBlurOrNone && <Text>{elementLabel}</Text>}
					</PictureContainer>
				);
			}),
		[backgroundSelected, meetingId, setBackgroundImage, t, virtualBackgroundImages]
	);

	return (
		<ListContainer
			padding={{ vertical: '0.5rem', horizontal: '0.126rem' }}
			data-testid="visualEffects-list"
			minHeight="18.527rem"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			gap="0.5rem"
		>
			{backgroundTiles}
		</ListContainer>
	);
};
export default VisualEffectsList;
