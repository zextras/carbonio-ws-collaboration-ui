/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { MEETINGS_PATH } from '../../../../constants/appConstants';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import Tile from '../../tile/Tile';

type AccessTileProps = {
	videoStreamRef: React.RefObject<HTMLVideoElement>;
	videoPlayerTestMuted: boolean;
	mediaDevicesEnabled: { audio: boolean; video: boolean };
};

const AccessTile: FC<AccessTileProps> = ({
	videoStreamRef,
	videoPlayerTestMuted,
	mediaDevicesEnabled
}) => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);
	const userId: string | undefined = useStore((store) => getUserId(store));

	return (
		<Tile
			userId={userId}
			meetingId={meetingId}
			modalProps={{
				streamRef: videoStreamRef,
				streamMuted: videoPlayerTestMuted,
				audioStreamEnabled: mediaDevicesEnabled.audio,
				videoStreamEnabled: mediaDevicesEnabled.video
			}}
		/>
	);
};

export default AccessTile;
