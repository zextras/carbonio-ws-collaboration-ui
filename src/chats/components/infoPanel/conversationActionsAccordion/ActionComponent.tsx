/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Padding, Text, Icon, Row } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';
import styled from 'styled-components';

const CustomText = styled(Text)``;

const CustomIconButton = styled(IconButton)`
	background-color: ${({ theme, backgroundColor }): string =>
		theme.palette[backgroundColor].regular} !important;
	color: ${({ theme }): string => theme.palette.gray6.regular} !important;
	&:hover {
		background-color: ${({ theme, backgroundColor }): string =>
			theme.palette[backgroundColor].regular} !important;
		color: ${({ theme }): string => theme.palette.gray6.regular} !important;
	}
`;

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

type ActionProps = {
	icon: string;
	actionColor: string;
	label: string;
	padding: { top?: string; bottom?: string };
	withArrow?: boolean;
	action: () => void;
	isInsideMeeting?: boolean;
};

const ActionComponent: FC<ActionProps> = ({
	icon,
	actionColor,
	label,
	padding,
	withArrow,
	action,
	isInsideMeeting
}) => (
	<CustomActionContainer padding={padding} data-testid="action">
		<ActionContainer
			orientation="horizontal"
			width="fill"
			actionColor={actionColor}
			onClick={action}
		>
			<CustomContainer orientation="horizontal" mainAlignment="flex-start">
				<Row>
					<CustomIconButton
						icon={icon}
						iconColor="gray6"
						size="medium"
						backgroundColor={actionColor}
						onClick={action}
					/>
					<Padding right="large" />
				</Row>
				<Row takeAvailableSpace mainAlignment="flex-start">
					<CustomText color={isInsideMeeting ? 'gray0' : actionColor}>{label}</CustomText>
				</Row>
			</CustomContainer>
			{withArrow && (
				<CustomIcon
					icon="ArrowIosForwardOutline"
					color={isInsideMeeting ? 'gray0' : actionColor}
					size="medium"
				/>
			)}
		</ActionContainer>
	</CustomActionContainer>
);

export default ActionComponent;
