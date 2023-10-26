/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Padding, Shimmer } from '@zextras/carbonio-design-system';
import styled, { css, DefaultTheme, FlattenInterpolation, ThemeProps } from 'styled-components';

const CustomContainer = styled(Container)<{ $isTopContainer?: boolean }>`
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray6.active};
	${({ $isTopContainer }): FlattenInterpolation<ThemeProps<DefaultTheme>> | false | undefined =>
		$isTopContainer &&
		css`
			background-color: ${({ theme }): string => theme.palette.gray4.regular};
			min-height: 3rem;
			max-height: 3rem;
		`};
`;

const InfoPanelContainer = styled(Container)`
	overflow: hidden;
`;

const ShimmeringInfoPanelView = (): ReactElement => (
	<InfoPanelContainer mainAlignment="flex-start" crossAlignment="flex-start" width="35%">
		<CustomContainer crossAlignment="flex-start" padding={{ left: 'large' }} $isTopContainer>
			<Shimmer.Text width="35%" height="1.5rem" />
		</CustomContainer>

		<CustomContainer
			orientation="horizontal"
			height="fit"
			padding={{ left: 'large', right: 'large', top: 'large', bottom: 'large' }}
		>
			<Container width="fit" height="fit">
				<Shimmer.Avatar width="4rem" />
			</Container>
			<Padding right="large" />
			<Container crossAlignment="flex-start">
				<Shimmer.Text width="55%" />
				<Padding bottom="small" />
				<Shimmer.Text width="55%" />
			</Container>
			<Container crossAlignment="flex-end" mainAlignment="flex-start" padding={{ top: 'large' }}>
				<Shimmer.Avatar size="medium" radius="0.0625rem" />
			</Container>
		</CustomContainer>

		<CustomContainer padding={{ left: 'large', right: 'large' }} height="fit">
			<Container orientation="horizontal" height="fit" padding={{ top: 'large' }}>
				<Container crossAlignment="flex-start" height="fit">
					<Shimmer.Text width="55%" />
				</Container>
				<Container crossAlignment="flex-end">
					<Shimmer.Avatar size="small" radius="0.0625rem" />
				</Container>
			</Container>
			<Padding bottom="medium" />
			{[...Array(5)].map((x, i) => (
				<CustomContainer
					padding={{ top: 'small', bottom: 'small' }}
					orientation="horizontal"
					key={i}
					height="fit"
				>
					<Container width="fit" height="fit">
						<Shimmer.Avatar size="large" />
					</Container>
					<Padding right="large" />
					<Container crossAlignment="flex-start" height="fit">
						<Shimmer.Text width="55%" />
					</Container>
					<Container crossAlignment="flex-end" height="fit">
						<Shimmer.Avatar size="medium" radius="0.0625rem" />
					</Container>
				</CustomContainer>
			))}
		</CustomContainer>

		<CustomContainer height="fit" padding={{ left: 'large', right: 'large' }}>
			<Container orientation="horizontal" height="fit" padding={{ top: 'large' }}>
				<Container crossAlignment="flex-start">
					<Shimmer.Text width="55%" />
				</Container>
				<Container crossAlignment="flex-end">
					<Shimmer.Avatar size="small" radius="0.0625rem" />
				</Container>
			</Container>
			<Padding bottom="medium" />
			{[...Array(12)].map((x, i) => (
				<CustomContainer
					padding={{ top: 'small', bottom: 'small' }}
					orientation="horizontal"
					key={i}
					height="fit"
				>
					<Container width="fit" height="fit">
						<Shimmer.Avatar size="large" />
					</Container>
					<Padding right="large" />
					<Container crossAlignment="flex-start" height="fit">
						<Shimmer.Text width="55%" />
						<Padding bottom="small" />
						<Shimmer.Text width="40%" />
					</Container>
					<Container width="fit" mainAlignment="flex-end" orientation="horizontal" height="fit">
						<Shimmer.Avatar size="medium" radius="0.0625rem" />
						<Padding right="small" />
						<Shimmer.Avatar size="medium" radius="0.0625rem" />
					</Container>
				</CustomContainer>
			))}
		</CustomContainer>
	</InfoPanelContainer>
);

export default ShimmeringInfoPanelView;
