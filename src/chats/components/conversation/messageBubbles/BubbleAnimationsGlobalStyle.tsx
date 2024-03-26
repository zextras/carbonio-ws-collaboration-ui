/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createGlobalStyle } from 'styled-components';

export enum ANIMATION_STYLES {
	HIGHLIGHT_MY_MESSAGE_DARK = 'highlightmymessagebubbledark',
	HIGHLIGHT_MESSAGE_DARK = 'highlightothersmessagebubbledark',
	HIGHLIGHT_MY_MESSAGE_LIGHT = 'highlightmymessagebubblelight',
	HIGHLIGHT_MESSAGE_LIGHT = 'highlightothersmessagebubblelight',
	HIGHLIGHT_MY_MESSAGE = 'highlightmymessagebubble',
	HIGHLIGHT_MESSAGE = 'highlightothersmessagebubble'
}

const AnimationGlobalStyle = createGlobalStyle`
  @keyframes highlightmymessagebubbledark {
    0%, 100% {
      background-color: #1d252d;
    }
    20%, 80% {
      background-color: #0E3858;
    }
  }

  @keyframes highlightothersmessagebubbledark {
    0%, 100% {
      background-color: #13181d;
    }
    20%, 80% {
      background-color: #0A243D;
    }
  }

  @keyframes highlightmymessagebubblelight {
    0%, 100% {
      background-color: #d5e3f6;
    }
    20%, 80% {
      background-color: #96b8e9;
    }
  }

  @keyframes highlightothersmessagebubblelight {
    0%, 100% {
      background-color: #ffffff;
    }
    20%, 80% {
      background-color: #d9d9d9;
    }
  }

  @keyframes highlightmymessagebubble {
    0%, 100% {
      background-color: #d5e3f6;
    }
    20%, 80% {
      background-color: #96b8e9;
    }
  }

  @keyframes highlightothersmessagebubble {
    0%, 100% {
      background-color: #ffffff;
    }
    20%, 80% {
      background-color: #d9d9d9;
    }
  }

  @media (prefers-color-scheme: dark) {
    @keyframes highlightmymessagebubble {
      0%, 100% {
        background-color: #1d252d;
      }
      20%, 80% {
        background-color: #0E3858;
      }
    }

    @keyframes highlightothersmessagebubble {
      0%, 100% {
        background-color: #13181d;
      }
      20%, 80% {
        background-color: #0A243D;
      }
    }
  }
`;

export default AnimationGlobalStyle;
