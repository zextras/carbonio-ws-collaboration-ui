/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Container,
	IconButton,
	Padding,
	Text,
	Icon,
	Row,
	Tooltip
} from '@zextras/carbonio-design-system';
import React, { FC } from 'react';
import styled, { css, SimpleInterpolation } from 'styled-components';

const CustomText = styled(Text)``;

const CustomIconButton = styled(IconButton)`
	${({ theme, backgroundColor, disabled }): false | ReadonlyArray<SimpleInterpolation> =>
		!disabled &&
		css`
			background-color: ${theme.palette[backgroundColor].regular} !important;
			color: ${theme.palette.gray6.regular} !important;
			&:hover {
				background-color: ${theme.palette[backgroundColor].regular} !important;
				color: ${theme.palette.gray6.regular} !important;
			}
		`};
`;

const CustomIcon = styled(Icon)`
	padding-right: 0.5rem;
`;

const ActionContainer = styled(Container)`
	border-radius: 0.5rem;
	height: fit-content;
	${({ theme, actionColor, disabled }): false | ReadonlyArray<SimpleInterpolation> =>
		!disabled &&
		css`
			cursor: pointer;
			&:hover {
				background-color: ${theme.palette[actionColor].regular};
				${CustomIcon} {
					color: ${theme.palette.gray6.regular} !important;
				}
				${CustomText} {
					color: ${theme.palette.gray6.regular};
				}
			}
		`};
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
	isDisabled?: boolean;
	disabledTooltip?: string;
};

const ActionComponent: FC<ActionProps> = ({
	icon,
	actionColor,
	label,
	padding,
	withArrow,
	action,
	isDisabled,
	disabledTooltip
}) => (
	<Tooltip disabled={!isDisabled} label={disabledTooltip}>
		<CustomActionContainer padding={padding} data-testid="action">
			<ActionContainer
				orientation="horizontal"
				width="fill"
				actionColor={actionColor}
				onClick={!isDisabled ? action : null}
				disabled={isDisabled}
			>
				<CustomContainer orientation="horizontal" mainAlignment="flex-start">
					<Row>
						<CustomIconButton
							icon={icon}
							iconColor="gray6"
							size="medium"
							backgroundColor={actionColor}
							onClick={action}
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
