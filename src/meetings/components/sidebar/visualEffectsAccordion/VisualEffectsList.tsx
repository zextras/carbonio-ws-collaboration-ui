/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container, Icon, Text } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import useVirtualBackground from '../../../../hooks/useVirtualBackground';
import { getBackgroundImage } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';
import { VirtualBackgroundType } from '../../../../types/store/ActiveMeetingTypes';

const PictureContainer = styled(Container)<{ $picture?: string | false; $isSelected: boolean }>`
	aspect-ratio: 1.2959;
	border-radius: 0.5rem;
	background-color: ${({ theme }): string => `${theme.palette.gray0.regular}`};
	${({ $isSelected, theme }): string | false =>
		$isSelected && `outline: 2px solid ${theme.palette.success.active};`}
	${({ $isSelected }): string | false => !$isSelected && `opacity: 0.6;`}
`;

const StyledImg = styled.img`
	border-radius: 0.5rem;
	aspect-ratio: 1.2959;
	min-height: 5.176rem;
	max-height: 7.267rem;
	min-width: 6.5rem;
	max-width: 9.25rem;
	object-fit: cover;
	object-position: center;
`;

const ListContainer = styled(Container)`
	overflow-y: scroll;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
`;

const VisualEffectsList: FC = () => {
	const [t] = useTranslation();
	const setBackgroundImage = useStore((store) => store.setBackgroundImage);
	const backgroundSelected = useStore(getBackgroundImage);

	const { virtualBackgroundImages } = useVirtualBackground();

	const backgroundTiles = useMemo(
		() =>
			map(VirtualBackgroundType, (element) => {
				const isBlurOrNone =
					element === VirtualBackgroundType.BLUR || element === VirtualBackgroundType.NONE;
				const isSelected = element === backgroundSelected;

				const changeBackground = (): void => {
					setBackgroundImage(element);
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
						data-testid={element}
						$isSelected={isSelected}
						gap="0.5rem"
					>
						{!isBlurOrNone ? (
							<StyledImg src={virtualBackgroundImages[element]} alt={element} />
						) : (
							<>
								<Icon
									size="large"
									icon={element === VirtualBackgroundType.BLUR ? 'Blur' : 'Slash'}
								/>
								<Text>{elementLabel}</Text>
							</>
						)}
					</PictureContainer>
				);
			}),
		[backgroundSelected, setBackgroundImage, t, virtualBackgroundImages]
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
