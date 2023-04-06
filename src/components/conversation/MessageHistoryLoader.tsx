/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Icon } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import styled from 'styled-components';

type MessageHistoryLoaderProps = {
	messageHistoryLoaderRef: React.RefObject<HTMLDivElement>;
};

const Loader = styled.div`
	background-color: ${({ theme }): string => theme.palette.gray6.active};
	color: #999;
	text-align: center;
	border-radius: 50%;
	margin: 0.875rem auto;
	width: 1.75rem;
	height: 1.75rem;

	@-moz-keyframes spin { 0% {transform: scaleX(-1) rotate(0deg);} 100% {transform: scaleX(-1) rotate(360deg);} }
	@-webkit-keyframes spin { 0% {transform: scaleX(-1) rotate(0deg);} 100% {transform: scaleX(-1) rotate(360deg);} }
	@keyframes spin { 0% {transform: scaleX(-1) rotate(0deg);} 100% {transform: scaleX(-1) rotate(360deg);} }
	}

	& svg {
		position: relative;
		top: 0.375rem;
		left: 0.375rem;
		-webkit-animation: spin 1s linear infinite;
		-moz-animation: spin 1s linear infinite;
		animation: spin 1s linear infinite;
	}
`;

const VisibilityContainer = styled.div`
	width: 100%;
	text-align: center;
`;

const MessageHistoryLoader = ({
	messageHistoryLoaderRef
}: MessageHistoryLoaderProps): ReactElement => (
	<VisibilityContainer data-testid={'messageHistoryLoader'} ref={messageHistoryLoaderRef}>
		<Loader>
			<Icon icon="RefreshOutline" size="medium" />
		</Loader>
	</VisibilityContainer>
);

export default MessageHistoryLoader;
