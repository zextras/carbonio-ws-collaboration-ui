/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

const CustomContainer = styled(Container)`
	background-color: ${({ theme }): string => theme.palette.gray4.regular};
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray6.active};
	min-height: 3rem;
	max-height: 3rem;
`;

const ShimmeringCollapsedListView = (): ReactElement => (
	<Container mainAlignment="flex-start" crossAlignment="flex-start">
		<CustomContainer orientation="horizontal" mainAlignment="flex-start">
			<Container crossAlignment="flex-start" padding="small">
				<Shimmer.Avatar width="1.9375rem" radius="0.0625rem" />
			</Container>
		</CustomContainer>
		{[...Array(10)].map((x, i) => (
			<Container
				orientation="horizontal"
				mainAlignment="flex-start"
				height="3rem"
				padding="small"
				key={i}
			>
				<Shimmer.Avatar width="2.5rem" radius="0.0625rem" />
			</Container>
		))}
	</Container>
);

export default ShimmeringCollapsedListView;
