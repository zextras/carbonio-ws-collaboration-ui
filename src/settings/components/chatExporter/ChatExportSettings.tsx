/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { useTranslation } from 'react-i18next';

import SettingsCard from '../SettingsCard';

const ChatExportSettings: FC = () => {
	const [t] = useTranslation();
	const titleLabel = t('', 'Chat export');
	const descriptionLabel = t(
		'',
		'Choose one of your chats to export messages to a text file. Remember that you are responsible for how you use the exported data.'
	);

	return (
		<SettingsCard title={titleLabel} description={descriptionLabel}>
			todo
		</SettingsCard>
	);
};

export default ChatExportSettings;
