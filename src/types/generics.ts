/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type Emoji = {
	emoticons: string[];
	id: string;
	keywords: string[];
	name: string;
	native: string;
	shortcodes: string;
	unified: string;
};

export enum Z_INDEX_RANK {
	DATE_STICKY_LABEL = 3,
	DROPDOWN_CXT = 2,
	EMOJI_PICKER = 10
}

export enum SIZES {
	ATTACHMENT_UPLOAD_SECTION = '11.25rem',
	REPLAY_EDIT_MESSAGE_VIEW_SECTION = '4.5rem',
	SPACE_FOR_ELEMENTS_VISIBLE_ON_MESSAGE_LIST = '18.4375rem'
}
