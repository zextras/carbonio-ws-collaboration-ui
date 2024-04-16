/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ContactMatch } from '../../../../network/soap/AutoCompleteRequest';

type GalListItemProps = {
	contact: ContactMatch;
};

const GalListItem: React.FC<GalListItemProps> = ({ contact }) => {
	const [t] = useTranslation();
	const descriptionLabel = t('', 'Click to create a chat with this user.');
	return (
		<Container key={contact.zimbraId} height="fit" width="fit">
			<Text size="small">{contact.email}</Text>
			<Text size="extrasmall">{descriptionLabel}</Text>
		</Container>
	);
};

export default GalListItem;
