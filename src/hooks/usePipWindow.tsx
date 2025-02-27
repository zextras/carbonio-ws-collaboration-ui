/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useContext } from 'react';

import { PiPContext } from '../meetings/components/pictureInPicture/PictureInPictureProvider';
import { PiPContextType } from '../types/pipTypes';

const usePiPWindow = (): PiPContextType => {
	const context = useContext(PiPContext);

	if (context === undefined) {
		throw new Error('usePiPWindow must be used within a PiPContext');
	}

	return context;
};

export default usePiPWindow;
