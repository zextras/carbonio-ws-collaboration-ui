/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import * as darkreader from 'darkreader';

export const useDarkReaderStatus = (): boolean => useMemo(() => darkreader.isEnabled(), []);

export default useDarkReaderStatus;
