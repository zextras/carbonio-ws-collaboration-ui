/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useRef } from 'react';

import data from '@emoji-mart/data';
import { Container } from '@zextras/carbonio-design-system';
import { Picker } from 'emoji-mart';
import moment from 'moment-timezone';

import { Emoji } from '../../../../../types/generics';

type EmojiPickerProps = {
	onEmojiSelect: (emoji: string) => void;
};

const CustomReactionPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
	const pickerContainerRef = useRef<HTMLDivElement>(null);
	const pickerRef = useRef<Picker | null>(null);

	const sendCustomReaction = useCallback(
		(emoji: Emoji) => onEmojiSelect(emoji.native),
		[onEmojiSelect]
	);

	useEffect(() => {
		// em-emoji-picker can be registered only once per page: if another module (e.g. Mails) bundling its
		// own emoji-mart registered it first, constructing our Picker class throws "Illegal constructor"
		const PickerClass =
			(customElements.get('em-emoji-picker') as typeof Picker | undefined) ?? Picker;
		pickerRef.current = new PickerClass({
			onEmojiSelect: sendCustomReaction,
			previewPosition: 'none',
			data,
			ref: pickerContainerRef,
			locale: moment.locale(),
			maxFrequentRows: 1,
			perLine: 7,
			navPosition: 'none',
			noCountryFlags: true,
			skinTonePosition: 'none'
		});
		return (): void => {
			pickerRef.current = null;
		};
	}, [sendCustomReaction]);

	return (
		<Container
			ref={pickerContainerRef}
			data-testid="custom-reaction-picker"
			height="15rem"
			width="17.5rem"
		/>
	);
};

export default CustomReactionPicker;
