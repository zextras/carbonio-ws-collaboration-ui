/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Padding, Tooltip } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import styled from 'styled-components';

const Stream = styled(Container)``;

const SidebarIconButton = styled(IconButton)`
	height: 240px;
	width: 36px;
`;

const StreamsCarousel = (): ReactElement => (
	<Container orientation="horizontal" width="fit" height="fill">
		<Padding right="large" />
		<Tooltip label={'needed to add'}>
			<SidebarIconButton
				iconColor="gray6"
				backgroundColor="text"
				icon={true ? 'ChevronRightOutline' : 'ChevronLeftOutline'}
				size="large"
			/>
		</Tooltip>
		<Padding right="large" />
		<Container>
			<Stream height="144px" width="256px" background="secondary" />
			<Padding bottom="small" />
			<Stream height="144px" width="256px" background="secondary" />
			<Padding bottom="small" />
			<Stream height="144px" width="256px" background="secondary" />
		</Container>
	</Container>
);

export default StreamsCarousel;
