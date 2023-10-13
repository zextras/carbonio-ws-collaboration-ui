/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Shimmer, Padding } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

const CustomContainer = styled(Container)`
	background-color: ${({ theme }): string => theme.palette.gray4.regular};
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray6.active};
	min-height: 3rem;
	max-height: 3rem;
`;

const ShimmeringExpandedListView = (): ReactElement => (
	<Container mainAlignment="flex-start" crossAlignment="flex-start">
		<CustomContainer orientation="horizontal" mainAlignment="flex-start">
			<Container crossAlignment="flex-start" padding={{ left: 'large' }}>
				<Shimmer.Text width="70%" />
			</Container>
			<Container crossAlignment="flex-end" padding={{ right: 'large' }}>
				<Shimmer.Avatar size="medium" radius="0.0625rem" />
			</Container>
		</CustomContainer>
		<Container mainAlignment="flex-start">
			{[...Array(10)].map((x, i) => (
				<Container orientation="horizontal" mainAlignment="flex-start" height="3rem" key={i}>
					<Padding left="large" />
					<Shimmer.Avatar size="medium" radius="0.0625rem" />
					<Padding left="small" />
					<Shimmer.Text width="70%" />
				</Container>
			))}
		</Container>
	</Container>
);

export default ShimmeringExpandedListView;
