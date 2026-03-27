/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Icon, Padding, Text, Tooltip } from '@zextras/carbonio-design-system';
import { Trans, useTranslation } from 'react-i18next';

import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { ForwardedInfo } from '../../../../types/store/ChatsRegistryTypes';
import { formatDate } from '../../../../utils/dateUtils';

type ForwardInfoProps = {
	info: ForwardedInfo;
};

const ForwardInfo: FC<ForwardInfoProps> = ({ info }) => {
	const forwardUsername = useStore((store) => getUserName(store, info.originalSenderId));

	const [t] = useTranslation();

	const originalDate = new Date(info.originalSentAt).getTime();
	const messageDate = formatDate(originalDate, 'DD MMM YY');
	const messageTime = formatDate(originalDate, 'HH:mm');
	const originallySentByLabel = (
		<Trans
			i18nKey="message.originallySentBy"
			defaults="<strong>Originally sent by:</strong> {{forwardUsername}} ({{messageDate}} - {{messageTime}})"
			values={{
				forwardUsername,
				messageDate,
				messageTime
			}}
		/>
	);

	return (
		<Container
			padding={{ bottom: 'small' }}
			orientation="horizontal"
			mainAlignment="flex-start"
			gap={'0.25rem'}
			height={'fit'}
		>
			<Icon icon="Forward" size="small" color="secondary" />
			<Tooltip label={originallySentByLabel}>
				<Text color="secondary" size="small">
					{originallySentByLabel}
				</Text>
			</Tooltip>
		</Container>
	);
};

export default ForwardInfo;
