/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Padding, Shimmer } from '@zextras/carbonio-design-system';
import styled, { css, DefaultTheme, FlattenInterpolation, ThemeProps } from 'styled-components';

const CustomContainer = styled(Container)<{
	$isBottomContainer?: boolean;
	$isTopContainer?: boolean;
}>`
	min-height: 3rem;
	max-height: 3.25rem;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray6.active};
	${({ $isBottomContainer }): FlattenInterpolation<ThemeProps<DefaultTheme>> | false | undefined =>
		$isBottomContainer &&
		css`
			background-color: ${({ theme }): string => theme.palette.gray4.regular};
			border-top: 0.0625rem solid ${({ theme }): string => theme.palette.gray6.active};
		`};
	${({ $isTopContainer }): FlattenInterpolation<ThemeProps<DefaultTheme>> | false | undefined =>
		$isTopContainer &&
		css`
			background-color: ${({ theme }): string => theme.palette.gray4.regular};
		`};
`;

const MessageContainer = styled(Container)`
	background-color: ${({ theme }): string => theme.palette.gray4.regular};
`;

const RepliedMessageContainer = styled(Container)`
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
`;

const SmallContainer = styled(Container)`
	background-color: ${({ theme }): string => theme.palette.gray3.regular};
`;

const WhiteContainer = styled(Container)`
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
	border-right: 0.0625rem solid ${({ theme }): string => theme.palette.gray6.active};
	overflow: hidden;
`;

const ShimmerMessageContainer = styled(Container)`
	border-radius: 0 0.25rem 0.25rem 0.25rem;
	padding-left: 1.25rem;
	padding-right: 27%;
	padding-bottom: 0.25rem;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
`;

const ShimmerMessageContainer3 = styled(Container)`
	border-radius: 0 0.25rem 0.25rem 0.25rem;
	padding-left: 1.25rem;
	padding-right: 32%;
	padding-bottom: 2rem;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
`;

const ShimmerMessageContainer2 = styled(Container)`
	border-radius: 0.25rem 0.25rem 0 0.25rem;
	padding-left: 23%;
	padding-right: 3.125rem;
	padding-bottom: 0.25rem;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
`;

const ShimmerMessageContainer4 = styled(Container)`
	border-radius: 0.25rem 0.25rem 0 0.25rem;
	padding-left: 54%;
	padding-right: 3.125rem;
	padding-bottom: 0.25rem;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
`;

const ShimmerMessageContainer5 = styled(Container)`
	border-radius: 0.25rem 0.25rem 0 0.25rem;
	padding-left: 65%;
	padding-right: 3.125rem;
	padding-bottom: 2rem;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
`;

const ShimmeringConversationView = (): ReactElement => (
	<WhiteContainer mainAlignment="flex-start" crossAlignment="flex-start" width="100%">
		<CustomContainer
			crossAlignment="flex-start"
			orientation="horizontal"
			height="3rem"
			padding={{ left: 'large', right: 'large' }}
			$isTopContainer
		>
			<Container crossAlignment="flex-start">
				<Shimmer.Text width="20%" height="1.5rem" />
			</Container>
			<Container crossAlignment="flex-end">
				<Shimmer.Avatar size="medium" radius="0.0625rem" />
			</Container>
		</CustomContainer>

		<Container height={'calc(100% - 6.25rem)'} mainAlignment="flex-end">
			<ShimmerMessageContainer height="fit">
				<MessageContainer height="10.3125rem" padding={'large'} crossAlignment="flex-start">
					<Shimmer.Text width="20%" height="1rem" />
					<Padding bottom="small" />
					<RepliedMessageContainer orientation="horizontal">
						<SmallContainer height="fill" width="0.25rem" />
						<Padding right="small" />
						<Shimmer.Avatar width="2.8125rem" radius="0.5rem" />
						<Padding right="small" />
						<Container height="fit" crossAlignment="flex-start">
							<Shimmer.Text width="20%" height="1rem" />
							<Padding bottom="small" />
							<Shimmer.Text width="18.75rem" height="1rem" />
						</Container>
					</RepliedMessageContainer>
					<Padding bottom="small" />
					<Container crossAlignment="flex-start">
						<Shimmer.Text width="20%" height="1rem" />
						<Padding bottom="small" />
						<Shimmer.Text width="65%" height="1rem" />
					</Container>
				</MessageContainer>
			</ShimmerMessageContainer>

			<ShimmerMessageContainer3 height="fit">
				<MessageContainer height="4.5625rem" padding={'large'} crossAlignment="flex-start">
					<Shimmer.Text height="1rem" />
					<Padding bottom="small" />
					<Shimmer.Text height="1rem" width="25%" />
				</MessageContainer>
			</ShimmerMessageContainer3>

			<ShimmerMessageContainer4 height="fit">
				<MessageContainer height="4.5625rem" padding={'large'} crossAlignment="flex-start">
					<Shimmer.Text width="20%" height="1rem" />
					<Padding bottom="small" />
					<Shimmer.Text height="1rem" />
				</MessageContainer>
			</ShimmerMessageContainer4>

			<ShimmerMessageContainer2 height="fit">
				<MessageContainer height="8.8125rem" padding={'large'}>
					<RepliedMessageContainer orientation="horizontal">
						<SmallContainer height="fill" width="0.25rem" />
						<Padding right="small" />
						<Shimmer.Avatar width="2.8125rem" radius="0.5rem" />
						<Padding right="small" />
						<Container height="fit" crossAlignment="flex-start">
							<Shimmer.Text width="20%" height="1rem" />
							<Padding bottom="small" />
							<Shimmer.Text width="18.75rem" height="1rem" />
						</Container>
					</RepliedMessageContainer>
					<Padding bottom="small" />
					<Container crossAlignment="flex-start">
						<Shimmer.Text width="20%" height="1rem" />
						<Padding bottom="small" />
						<Shimmer.Text width="70%" height="1rem" />
					</Container>
				</MessageContainer>
			</ShimmerMessageContainer2>
		</Container>

		<ShimmerMessageContainer5 height="fit">
			<MessageContainer height="4.5625rem" padding={'large'} crossAlignment="flex-start">
				<Shimmer.Text height="1rem" />
			</MessageContainer>
		</ShimmerMessageContainer5>

		<Container padding={'large'} height="fit" crossAlignment="flex-start">
			<Shimmer.Text width="15.625rem" height="1rem" />
		</Container>

		<Padding bottom="large" />
		<CustomContainer
			mainAlignment="flex-end"
			orientation="horizontal"
			height="3.25rem"
			padding={{ left: 'small', right: 'small' }}
			$isBottomContainer
		>
			<Container crossAlignment="flex-start" width="fit">
				<Shimmer.Avatar size="medium" radius="0.0625rem" />
			</Container>
			<Padding right="large" />
			<Container crossAlignment="flex-start">
				<Shimmer.Text width="20%" height="1rem" />
			</Container>
			<Container crossAlignment="flex-end">
				<Shimmer.Avatar size="medium" radius="0.0625rem" />
			</Container>
		</CustomContainer>
	</WhiteContainer>
);

export default ShimmeringConversationView;
