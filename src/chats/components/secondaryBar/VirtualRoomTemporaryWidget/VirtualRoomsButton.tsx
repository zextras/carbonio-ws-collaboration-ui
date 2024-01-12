/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useRef, useState } from 'react';

import { Button, Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import VirtualRoomsList from './VirtualRoomsList';

const VirtualRoomsButton = (): ReactElement => {
	const [t] = useTranslation();
	const virtualRoomsLabel = t('meeting.scheduledMeetings.virtualRoomLabel', 'Your Virtual Rooms');

	const [listVisibility, setListVisibility] = useState(false);

	const parentRef = useRef<HTMLDivElement>(null);

	const handleOnClick = useCallback(() => {
		setListVisibility((prevState: boolean) => !prevState);
	}, []);

	return (
		<>
			<Container padding="0.5rem" background="gray5">
				<Button
					label={virtualRoomsLabel}
					color="primary"
					type="outlined"
					width="fill"
					onClick={handleOnClick}
					ref={parentRef}
				/>
			</Container>
			<VirtualRoomsList
				listVisibility={listVisibility}
				setListVisibility={setListVisibility}
				parentRef={parentRef}
			/>
		</>
	);
};

export default VirtualRoomsButton;
