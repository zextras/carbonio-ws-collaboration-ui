/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Icon, Padding, Text, Tooltip } from '@zextras/carbonio-design-system';
import moment from 'moment-timezone';
import { useTranslation } from 'react-i18next';

import { getPrefTimezoneSelector } from '../../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { ForwardedInfo } from '../../../../types/store/MessageTypes';

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

	const timezone = useStore(getPrefTimezoneSelector);
	const messageDate = moment.tz(info.date, timezone).format('DD MMM YY');
	const messageTime = moment.tz(info.date, timezone).format('HH:mm');

	return (
		<Container padding={{ bottom: 'small' }} orientation="horizontal" mainAlignment="flex-start">
			{info.count > 1 && (
				<Tooltip label={forwardedMultipleTimesLabel}>
					<Padding right="small">
						<Icon icon="ForwardMultipleTimes" size="small" color="secondary" />
					</Padding>
				</Tooltip>
			)}
			<Text color="secondary" size="small">
				{originallySentByLabel} {forwardUsername} ({messageDate} - {messageTime})
			</Text>
		</Container>
	);
};

export default ForwardInfo;
