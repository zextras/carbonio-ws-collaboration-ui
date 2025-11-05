/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useMemo } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Container, Padding, Text, useTheme } from '@zextras/carbonio-design-system';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { useTranslation } from 'react-i18next';

import { calculateAvatarColor } from '../../../../utils/styleUtils';

type RoomPictureProps = {
	title: string;
	description: React.ReactNode | null;
	picture: string | undefined;
	backgroundColor?: string;
	moreHoverActions?: React.ReactNode;
};

const HoverContainer = styled(Container)`
	opacity: 0;
`;

const BackgroundContainer = styled(Container)<{
	$hasHoverGradient: boolean;
	$color: string;
}>`
	position: relative;
	border-radius: 0;
	background-color: ${({ $color }): string | false => `${$color}`};
	&:hover {
		${({ $hasHoverGradient, $color }): false | ReturnType<typeof css> =>
			$hasHoverGradient &&
			css`
				background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), ${$color};
				background: -webkit-linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), ${$color};
				background: -moz-linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), ${$color};
			`}
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const PictureContainer = styled(Container)<{ $picture: string }>`
	position: relative;
	border-radius: 0;
	background-image: url(${({ $picture }): string => $picture});
	background-size: cover;
	background-position: center;
	aspect-ratio: 1/1;
	cursor: pointer;

	&:after {
		background-color: ${({ theme }): string => `${theme.palette.gray6.regular}`};
		z-index: 1;
	}

	&:hover {
		${({ $picture }): ReturnType<typeof css> => css`
			background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${$picture});
			background-image:
				-webkit-linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${$picture});
			background-image:
				-moz-linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${$picture});
		`}
		background-size: cover;
		background-position: center;
		aspect-ratio: 1/1;

		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const GradientContainer = styled(Container)`
	background: linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 45%);
`;

const InfoContainer = styled(Container)`
	position: absolute;
	bottom: 0;
	left: 0;
	cursor: default;
`;

const NameWrapText = styled(Text)<{ $hasPicture: boolean }>`
	white-space: unset;
	overflow: unset;
	text-overflow: unset;
	word-break: break-word;
	text-shadow: ${({ $hasPicture }): string | false =>
		$hasPicture && '0.063rem 0.063rem 0.25rem #111'};
`;

const RoomPictureHandler: FC<RoomPictureProps> = ({
	title,
	description,
	picture,
	backgroundColor,
	moreHoverActions
}) => {
	const [t] = useTranslation();
	const closeLabel = t('action.close', 'Close');

	const themeColor = useTheme();

	const { createPreview } = useContext(PreviewsManagerContext);
	const onPreviewClick = useCallback(() => {
		if (picture) {
			createPreview({
				previewType: 'image',
				filename: title,
				closeAction: {
					id: 'close-action',
					icon: 'ArrowBackOutline',
					tooltipLabel: closeLabel
				},
				src: picture
			});
		}
	}, [picture, createPreview, title, closeLabel]);

	const stopPropagation = useCallback(
		(e: { stopPropagation: () => void }) => e.stopPropagation(),
		[]
	);

	const hoverContainer = useMemo(
		() => (
			<HoverContainer height="fit" onClick={stopPropagation}>
				{moreHoverActions}
			</HoverContainer>
		),
		[moreHoverActions, stopPropagation]
	);

	const conversationInfo = useMemo(
		() => (
			<InfoContainer
				orientation="vertical"
				crossAlignment="flex-start"
				mainAlignment="flex-end"
				padding={{ left: 'large', bottom: 'large', right: 'large' }}
				width="fill"
				height="fit"
				onClick={stopPropagation}
			>
				<NameWrapText color="gray6" size="medium" $hasPicture={!!picture}>
					{title}
				</NameWrapText>
				<Padding top="extrasmall" />
				{description}
			</InfoContainer>
		),
		[stopPropagation, picture, title, description]
	);

	return !picture ? (
		<BackgroundContainer
			$color={backgroundColor ?? themeColor.avatarColors[calculateAvatarColor(title)]}
			$hasHoverGradient={!!picture || !!moreHoverActions}
			mainAlignment="flex-end"
			minHeight="10rem"
			maxHeight="10rem"
			data-testid="background_container"
		>
			<GradientContainer>
				{hoverContainer}
				{conversationInfo}
			</GradientContainer>
		</BackgroundContainer>
	) : (
		<Container background={'gray6'} height="fit">
			<PictureContainer
				$picture={picture}
				mainAlignment="flex-end"
				height="15.625rem"
				data-testid="picture_container"
				onClick={onPreviewClick}
			>
				<GradientContainer>
					{hoverContainer}
					{conversationInfo}
				</GradientContainer>
			</PictureContainer>
		</Container>
	);
};

export default RoomPictureHandler;
