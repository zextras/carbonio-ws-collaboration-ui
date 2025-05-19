/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

export type PiPContextType = {
	isSupported: boolean;
	pipWindow: Window | null;
	requestPipWindow: (width: number, height: number) => Promise<void>;
	closePipWindow: () => void;
};

export type PiPProviderProps = {
	children: React.ReactNode;
};

export type PiPWindowProps = {
	pipWindow: Window;
	children: React.ReactNode;
};
