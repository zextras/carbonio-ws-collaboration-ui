/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useRef } from 'react';

import { EventName, EventPayloads } from 'wsc-shared';

export const sendCustomEvent = <E extends EventName>(event: {
	name: E;
	data: EventPayloads[E];
}): void => {
	window.dispatchEvent(new CustomEvent(event.name, { detail: event.data }));
};

const useEventListener = <E extends EventName>(
	eventName: E,
	handler: (data: EventPayloads[E]) => void,
	element = window
): void => {
	const savedHandler = useRef(handler);

	useEffect(() => {
		savedHandler.current = handler;
	}, [handler]);

	useEffect(() => {
		const eventListener = (event: Event): void => {
			if (event instanceof CustomEvent) {
				savedHandler.current(event.detail as EventPayloads[E]);
			}
		};
		element.addEventListener(eventName, eventListener);
		return (): void => {
			element.removeEventListener(eventName, eventListener);
		};
	}, [eventName, element]);
};

export default useEventListener;
