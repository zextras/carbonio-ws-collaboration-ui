/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import { getCustomLogo } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import defaultLogo from '../assets/Logo.png';

const LogoApp = styled(Container)<{
	$customLogo: string | false | undefined;
	$top: string | undefined;
	$left: string | undefined;
}>`
	position: absolute;
	top: ${({ $top }): string => $top ?? '1rem'};
	left: ${({ $left }): string => $left ?? '1rem'};
	background-size: contain;
	height: 1.3125rem;
	width: 9.625rem;
	background-repeat: no-repeat;
	background-image: url(${({ $customLogo }): string => $customLogo || defaultLogo});
`;

const Logo = ({ top, left }: { top?: string; left?: string }): JSX.Element => {
	const customLogo = useStore(getCustomLogo);
	return <LogoApp $customLogo={customLogo} $top={top} $left={left} />;
};

export default Logo;
