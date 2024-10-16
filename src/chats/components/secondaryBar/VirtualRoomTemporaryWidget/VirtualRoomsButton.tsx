/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useRef, useState } from 'react';

import { Button, Container, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import VirtualRoomsList from './VirtualRoomsList';

type virtualRoomsButtonProps = {
	expanded: boolean;
};

const VirtualRoomsButton: FC<virtualRoomsButtonProps> = ({ expanded }) => {
	const [t] = useTranslation();
	const virtualRoomsLabel = t('meeting.virtual.buttonLabel', 'Your Virtual Rooms');

	const [listVisibility, setListVisibility] = useState(false);

	const parentRef = useRef<HTMLDivElement>(null);

	const handleOnClick = useCallback(() => {
		setListVisibility((prevState: boolean) => !prevState);
	}, []);

	return expanded ? (
		<>
			<Container padding="0.5rem" height="fit" background={'gray5'}>
				<Button
					label={virtualRoomsLabel}
					color="primary"
					type="outlined"
					width="fill"
					onClick={handleOnClick}
					ref={parentRef}
				/>
			</Container>
			{listVisibility && (
				<VirtualRoomsList setListVisibility={setListVisibility} parentRef={parentRef} />
			)}
		</>
	) : (
		<Container padding="0.5rem" height="fit" background={'gray5'}>
			<Tooltip label={virtualRoomsLabel}>
				<Button
					icon="VideoOutline"
					size="large"
					onClick={handleOnClick}
					type="outlined"
					labelColor="primary"
					backgroundColor="gray6"
				/>
			</Tooltip>
		</Container>
	);
};

export default VirtualRoomsButton;
