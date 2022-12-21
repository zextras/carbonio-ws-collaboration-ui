/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Padding, Text, Icon } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';
import styled from 'styled-components';

const CustomText = styled(Text)``;

const CustomIcon = styled(Icon)`
	padding-right: 0.5rem;
`;

const ActionContainer = styled(Container)`
	border-radius: 0.5rem;
	height: fit-content;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme, actionColor }): string => theme.palette[actionColor].regular};
		${CustomIcon} {
			color: ${({ theme }): string => theme.palette.gray6.regular} !important;
		}
		${CustomText} {
			color: ${({ theme }): string => theme.palette.gray6.regular};
		}
	}
	-webkit-user-select: none;
	user-select: none;
`;

const CustomContainer = styled(Container)`
	background-color: transparent;
`;

const CustomActionContainer = styled(Container)`
	padding-right: 0.5rem;
`;

const CustomIconButton = styled(IconButton)``;

type ActionProps = {
	icon: string;
	actionColor: string;
	label: string;
	padding: { top?: string; bottom?: string };
	withArrow?: boolean;
	action: () => void;
};

const ActionComponent: FC<ActionProps> = ({
	icon,
	actionColor,
	label,
	padding,
	withArrow,
	action
}) => (
	<CustomActionContainer padding={padding} data-testid="action">
		<ActionContainer
			orientation="horizontal"
			width="fill"
			actionColor={actionColor}
			onClick={action}
		>
			<CustomContainer orientation="horizontal" mainAlignment="flex-start">
				<CustomIconButton
					icon={icon}
					iconColor="gray6"
					size="medium"
					backgroundColor={actionColor}
				/>
				<Padding right="large" />
				<CustomText size={'medium'} color={actionColor}>
					{label}
				</CustomText>
			</CustomContainer>
			{withArrow && <CustomIcon icon="ArrowIosForwardOutline" color={actionColor} size="medium" />}
		</ActionContainer>
	</CustomActionContainer>
);

export default ActionComponent;
