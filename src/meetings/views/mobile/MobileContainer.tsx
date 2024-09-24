/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useEffect } from 'react';

import { Container } from '@zextras/carbonio-design-system';

const MobileContainer = ({ children }: { children: ReactElement }): ReactElement => {
	const ref = React.createRef<HTMLDivElement>();

	useEffect(() => {
		const shellViewBackground =
			ref.current?.parentElement?.parentElement?.parentElement?.parentElement;
		if (shellViewBackground) {
			shellViewBackground.style.minWidth = '0';
		}
	}, [ref]);

	return <Container ref={ref}>{children}</Container>;
};

export default MobileContainer;
