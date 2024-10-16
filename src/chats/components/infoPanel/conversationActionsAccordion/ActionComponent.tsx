/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import {
	Container,
	Padding,
	Text,
	Icon,
	Row,
	Tooltip,
	PaddingObj,
	Button
} from '@zextras/carbonio-design-system';
import styled, { DefaultTheme } from 'styled-components';

const CustomText = styled(Text)``;

const CustomHoverButton = styled(Button)``;

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
		background-color: ${({ theme, $actionColor, disabled }): string =>
			disabled
				? theme.palette[$actionColor].disabled
				: theme.palette[$actionColor].regular} !important;
		${CustomHoverButton} {
			background-color: ${({ theme, $actionColor, disabled }): string =>
				disabled
					? theme.palette[$actionColor].disabled
					: theme.palette[$actionColor].regular} !important;
			color: ${({ theme, disabled }): string =>
				disabled ? theme.palette.gray6.disabled : theme.palette.gray6.regular} !important;
		}
		${CustomIcon} {
			color: ${({ theme, disabled }): string =>
				disabled ? theme.palette.gray6.disabled : theme.palette.gray6.regular} !important;
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
	actionTestId
}) => (
	<Tooltip disabled={!isDisabled} label={disabledTooltip}>
		<CustomActionContainer padding={padding} data-testid="action">
			<ActionContainer
				data-testid={idComponent ?? 'action'}
				orientation="horizontal"
				width="fill"
				$actionColor={actionColor}
				onClick={!isDisabled ? action : (): null => null}
				disabled={isDisabled}
			>
				<CustomContainer orientation="horizontal" mainAlignment="flex-start">
					<Row>
						<CustomHoverButton
							data-testid={actionTestId ?? 'action-button'}
							icon={icon}
							backgroundColor={actionColor}
							onClick={!isDisabled ? action : (): null => null}
							disabled={isDisabled}
						/>
						<Padding right="large" />
					</Row>
					<Row takeAvailableSpace mainAlignment="flex-start">
						<CustomText color={actionColor} disabled={isDisabled}>
							{label}
						</CustomText>
					</Row>
				</CustomContainer>
				{withArrow && (
					<CustomIcon
						disabled={isDisabled}
						icon="ArrowIosForwardOutline"
						color={actionColor}
						size="medium"
					/>
				)}
			</ActionContainer>
		</CustomActionContainer>
	</Tooltip>
);

export default ActionComponent;
