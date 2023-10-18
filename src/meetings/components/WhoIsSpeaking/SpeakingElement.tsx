/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';

const CustomContainer = styled(Container)`
	border-radius: 0.25rem;
	${({ theme }): string | false => `outline: 0.125rem solid ${theme.palette.success.regular};`}
`;

type SpeakingElementProps = {
	userId: string;
};
const SpeakingElement = ({ userId }: SpeakingElementProps): ReactElement => {
	const userName = useStore((store) => getUserName(store, userId));
	return (
		<CustomContainer
			width="fit"
			height="fit"
			padding={{ vertical: '0.5rem', horizontal: '1rem' }}
			background="gray0"
		>
			{userName}
		</CustomContainer>
	);
};

export default SpeakingElement;
