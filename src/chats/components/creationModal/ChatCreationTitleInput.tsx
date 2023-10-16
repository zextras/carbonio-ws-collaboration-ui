/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';

import { Padding, Container, Input } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type ChatCreationProps = {
	title: string;
	setTitle: Dispatch<SetStateAction<string>>;
	topic: string;
	setTopic: Dispatch<SetStateAction<string>>;
	titleError: boolean;
	topicError: boolean;
};

const ChatCreationTitleInput: FC<ChatCreationProps> = ({
	title,
	setTitle,
	topic,
	setTopic,
	titleError,
	topicError
}) => {
	const [t] = useTranslation();
	const titlePlaceholder = t('conversationInfo.title', 'Title');
	const topicPlaceholder = t('conversationInfo.topic', 'Topic');

	const titleDescription = useMemo(() => {
		if (title.length === 0)
			return t('editModal.nameTooShort', 'The title is an essential information');
		if (title.length > 128)
			return t('editModal.nameTooLong', 'Maximum title length is 128 characters');
		return t('editModal.groupNameDetails', 'It is required and identifies the Group');
	}, [t, title]);

	const topicDescription = useMemo(() => {
		if (topic.length > 256)
			return t('editModal.topicTooLong', 'Maximum topic length is 256 characters');
		return t('editModal.groupDescriptionDetails', 'It describes the subject of the Group');
	}, [topic, t]);

	const handleTitleChange = useCallback(
		(event) => {
			if (event.target.value.length <= 129) setTitle(event.target.value);
		},
		[setTitle]
	);
	const handleTopicChange = useCallback(
		(event) => {
			if (event.target.value.length <= 257) setTopic(event.target.value);
		},
		[setTopic]
	);

	return (
		<Container width="fill">
			<Padding top="small" />
			<Input
				data-testid="name_input"
				value={title}
				label={`${titlePlaceholder}*`}
				description={titleDescription}
				onChange={handleTitleChange}
				backgroundColor="gray5"
				hasError={titleError}
			/>
			<Padding bottom="small" />
			<Input
				data-testid="description_input"
				value={topic}
				label={topicPlaceholder}
				description={topicDescription}
				onChange={handleTopicChange}
				backgroundColor="gray5"
				hasError={topicError}
			/>
		</Container>
	);
};

export default ChatCreationTitleInput;
