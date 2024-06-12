/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Icon, Text, Padding } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

type ConversationInfoDetailsElementProps = {
	label: string | undefined;
	icon: string;
	type: string;
};

const CustomText = styled(Text)`
	cursor: default;
`;

const ConversationInfoDetailsElement: FC<ConversationInfoDetailsElementProps> = ({
	label,
	icon,
	type
}) => (
	<Container orientation="horizontal" crossAlignment="flex-start">
		<Container width="fit-content" height="fit-content">
			<Icon icon={icon} size="medium" />
		</Container>
		<Container orientation="vertical" crossAlignment="flex-start" padding={{ left: 'small' }}>
			<Text title={label} size="small" overflow="break-word">
				{label}
			</Text>
			<Padding top="extrasmall" />
			<CustomText size="extrasmall" color="gray1">
				{type}
			</CustomText>
		</Container>
	</Container>
);

export default ConversationInfoDetailsElement;
