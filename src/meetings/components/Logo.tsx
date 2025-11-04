/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import styled from '@emotion/styled';

import { getCustomLogo } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import defaultLogo from '../assets/Logo.png';

const LogoApp = styled.img`
	position: absolute;
	width: 9.625rem;
	height: auto;
	object-fit: contain;
`;

const Logo = ({ top = '1rem', left = '1rem' }: { top?: string; left?: string }): JSX.Element => {
	const customLogo = useStore(getCustomLogo);
	return <LogoApp src={customLogo || defaultLogo} style={{ top, left }} />;
};

export default Logo;
