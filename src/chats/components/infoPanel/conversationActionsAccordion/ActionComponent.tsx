/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import {
	Container,
	IconButton,
	Padding,
	Text,
	Icon,
	Row,
	Tooltip,
	PaddingObj
} from '@zextras/carbonio-design-system';
import styled, { DefaultTheme } from 'styled-components';

const CustomText = styled(Text)``;

const CustomIconButton = styled(IconButton)<{ $backgroundColor: keyof DefaultTheme['palette'] }>`
	background-color: ${({ theme, $backgroundColor }): string =>
		theme.palette[$backgroundColor].regular} !important;
	color: ${({ theme }): string => theme.palette.gray6.regular} !important;
	&:hover {
		background-color: ${({ theme, $backgroundColor }): string =>
			theme.palette[$backgroundColor].regular} !important;
		color: ${({ theme }): string => theme.palette.gray6.regular} !important;
	}
`;

const CustomIcon = styled(Icon)`
	padding-right: 0.5rem;
`;

const ActionContainer = styled(Container)<{
	$actionColor: keyof DefaultTheme['palette'];
	disabled?: boolean;
}>`
	border-radius: 0.5rem;
	height: fit-content;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme, $actionColor }): string => theme.palette[$actionColor].regular};
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
	pointer-events: auto;
`;

type ActionProps = {
	icon: string;
	actionColor: keyof DefaultTheme['palette'];
	label: string;
	padding: PaddingObj;
	withArrow?: boolean;
	action: () => void;
	isDisabled?: boolean;
	disabledTooltip?: string;
	idComponent?: string;
	actionTestId?: string;
	isInsideMeeting?: boolean;
};

const ActionComponent: FC<ActionProps> = ({
	icon,
	actionColor,
	label,
	padding,
	withArrow,
	action,
	isDisabled,
	disabledTooltip,
	idComponent,
	actionTestId,
	isInsideMeeting
}) => (
	<Tooltip disabled={!isDisabled} label={disabledTooltip}>
		<CustomActionContainer padding={padding} data-testid="action">
			<ActionContainer
				data-testid={idComponent || 'action'}
				orientation="horizontal"
				width="fill"
				$actionColor={actionColor}
				onClick={!isDisabled ? action : (): null => null}
				disabled={isDisabled}
			>
				<CustomContainer orientation="horizontal" mainAlignment="flex-start">
					<Row>
						<CustomIconButton
							data-testid={actionTestId || 'action-button'}
							icon={icon}
							iconColor="gray6"
							size="medium"
							$backgroundColor={actionColor}
							onClick={action}
							disabled={isDisabled}
						/>
						<Padding right="large" />
					</Row>
					<Row takeAvailableSpace mainAlignment="flex-start">
						<CustomText color={isInsideMeeting ? 'gray0' : actionColor} disabled={isDisabled}>
							{label}
						</CustomText>
					</Row>
				</CustomContainer>
				{withArrow && (
					<CustomIcon
						disabled={isDisabled}
						icon="ArrowIosForwardOutline"
						color={isInsideMeeting ? 'gray0' : actionColor}
						size="medium"
					/>
				)}
			</ActionContainer>
		</CustomActionContainer>
	</Tooltip>
);

export default ActionComponent;
