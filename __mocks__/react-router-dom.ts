/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const useNavigate = vi.fn(() => vi.fn());

export const useParams = vi.fn(() => ({}));

export const useLocation = vi.fn(() => ({
	pathname: '/chats',
	search: '',
	hash: '',
	state: null,
	key: 'default'
}));

export const useSearchParams = vi.fn(() => [new URLSearchParams(), vi.fn()]);
