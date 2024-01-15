/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Icon, Padding, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { ForwardedInfo } from '../../../../types/store/MessageTypes';
import { formatDate } from '../../../../utils/dateUtils';

type ForwardInfoProps = {
	info: ForwardedInfo;
};
const ForwardInfo: FC<ForwardInfoProps> = ({ info }) => {
	const forwardUsername = useStore((store) => getUserName(store, info.from));

	const [t] = useTranslation();
	const originallySentByLabel = t('message.originallySentBy', 'Originally sent by:');
	const forwardedMultipleTimesLabel = t(
		'message.forwardedMultipleTimes',
		'Forwarded multiple times'
	);

	const messageDate = formatDate(info.date, 'DD MMM YY');
	const messageTime = formatDate(info.date, 'HH:mm');

	return (
		<Container padding={{ bottom: 'small' }} orientation="horizontal" mainAlignment="flex-start">
			{info.count > 1 && (
				<Tooltip label={forwardedMultipleTimesLabel}>
					<Padding right="extrasmall">
						<Icon icon="ForwardMultipleTimes" size="small" color="secondary" />
					</Padding>
				</Tooltip>
			)}
			<Text color="secondary" size="small" weight="bold">
				{originallySentByLabel}
			</Text>
			<Padding right="extrasmall" />
			<Text color="secondary" size="small">
				{forwardUsername} ({messageDate} - {messageTime})
			</Text>
		</Container>
	);
};

export default ForwardInfo;
