/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import data from '@emoji-mart/data';
import { Container } from '@zextras/carbonio-design-system';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Picker } from 'emoji-mart';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { Emoji } from '../../types/generics';

const PickerWrapper = styled(Container)`
	z-index: 10;
	position: absolute;
	bottom: 3.4375rem;
	left: 0.5rem;
	height: 27.1875rem;
	width: 22rem;
	transform-origin: bottom left;
	animation: showEmoji 0.2s ease-in 0s 1;

	@keyframes showEmoji {
		0% {
			//transform: scale(0);
			opacity: 0;
		}
		100% {
			//transform: scale(1, 1);
			opacity: 1;
		}
	}
`;

type EmojiPickerProps = {
	onEmojiSelect: (emoji: Emoji) => void;
};

const EmojiPicker: React.FC<EmojiPickerProps> = (props) => {
	const ref = useRef();

	useEffect(() => {
		// eslint-disable-next-line no-new
		new Picker({ previewPosition: 'none', ...props, data, ref });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <PickerWrapper ref={ref} />;
};

export default EmojiPicker;
