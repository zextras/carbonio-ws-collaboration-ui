/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createGlobalStyle } from 'styled-components';

const AnimationGlobalStyle = createGlobalStyle`
	@keyframes highlightmymessagebubble {
		0% {
			background-color: #d5e3f6;
		}
		100% {
			background-color: #B3D3FF;
		}
	}

    @keyframes highlightothersmessagebubble {
		0% {
			background-color: #ffffff;
		}
		100% {
			background-color: #E7E9EE;
		}
    }

    @media (prefers-color-scheme: dark) {
		@keyframes highlightmymessagebubble {
			0% {
				background-color: #1d252d;
			}
			100% {
			  	background-color: #0E3858;
			}
		}
		
		@keyframes highlightothersmessagebubble {
			0% {
			  	background-color: #13181d;
			}
			100% {
			  	background-color: #0A243D;
			}
		}
    }
`;

export default AnimationGlobalStyle;
