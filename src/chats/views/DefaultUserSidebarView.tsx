/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import styled from '@emotion/styled';
import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getAttribute } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import VirtualRoomsButton from '../components/secondaryBar/virtualRoomWidget/VirtualRoomsButton';

const CustomText = styled(Text)`
	text-align: center;
`;

type DefaultUserSidebarViewProps = {
	expanded: boolean;
};

const DefaultUserSidebarView: React.FC<DefaultUserSidebarViewProps> = ({
	expanded
}): ReactElement => {
	const [t] = useTranslation();
	const emptyListTitle = t('conversation.emptyList.list.title', 'There’s nothing there');
	const emptyListDescription = t(
		'conversation.emptyList.list.description',
		'Chats and Groups will appear listed here.'
	);

	const videoCallEnabled = useStore((store) => getAttribute(store, 'videoCallEnabled'));

	return (
		<>
			<Container mainAlignment="center" crossAlignment="center">
				{expanded && (
					<>
						<Container height="fit">
							<Text weight="bold" overflow="break-word" size="large" color="gray1">
								{emptyListTitle}
							</Text>
						</Container>
						<Padding bottom="small" />
						<Container height="fit" padding={{ left: 'large', right: 'large' }}>
							<CustomText overflow="break-word" size="small" color="gray1">
								{emptyListDescription}
							</CustomText>
						</Container>
					</>
				)}
			</Container>

			{videoCallEnabled && <VirtualRoomsButton expanded={expanded} />}
		</>
	);
};

export default DefaultUserSidebarView;
