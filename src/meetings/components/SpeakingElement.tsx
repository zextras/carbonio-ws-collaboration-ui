/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Padding } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import styled from 'styled-components';

import { getUserName } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';

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
		<>
			<CustomContainer
				width="fit"
				height="fit"
				padding={{ vertical: '0.5rem', horizontal: '1rem' }}
			>
				{userName}
			</CustomContainer>
			<Padding bottom="0.5rem" />
		</>
	);
};

export default SpeakingElement;
