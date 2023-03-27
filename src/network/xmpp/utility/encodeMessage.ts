/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { encode } from 'html-entities';

import { carbonize, carbonizeMUC } from './decodeJid';
import { AttachmentMessageType, TextMessage } from '../../../types/store/MessageTypes';

const createBodyElement = (text: string): Element => {
	const body = document.createElement('body');
	body.innerText = encode(text, { mode: 'extensive' });
	return body;
};

const createAttachmentElement = (attachment: AttachmentMessageType): Element => {
	const x = document.createElement('x');
	x.setAttribute('xmlns', 'urn:xmpp:muclight:0#configuration');
	// Add operation child to x
	const operation = document.createElement('operation');
	operation.innerHTML = 'attachmentAdded';
	x.appendChild(operation);
	// Add attachment-id child to x
	const attachmentId = document.createElement('attachment-id');
	attachmentId.innerHTML = attachment.id;
	x.appendChild(attachmentId);
	// Add filename child to x
	const filename = document.createElement('filename');
	filename.innerHTML = encodeURI(attachment.name);
	x.appendChild(filename);
	// Add mime-type child to x
	const mimeType = document.createElement('mime-type');
	mimeType.innerHTML = attachment.mimeType;
	x.appendChild(mimeType);
	// Add size child to x
	const size = document.createElement('size');
	size.innerHTML = attachment.size.toString();
	x.appendChild(size);
	return x;
};

export function encodeMessage(message: TextMessage): string {
	const messageElement = document.createElement('message');
	messageElement.setAttribute('xmlns', 'jabber:client');
	messageElement.setAttribute('type', 'groupchat');
	messageElement.setAttribute('to', carbonizeMUC(message.roomId));
	messageElement.setAttribute('id', message.id);
	messageElement.setAttribute('from', `${carbonizeMUC(message.roomId)}/${carbonize(message.from)}`);
	if (message.attachment) {
		messageElement.appendChild(createAttachmentElement(message.attachment));
	}
	messageElement.appendChild(createBodyElement(message.text));
	return messageElement.outerHTML;
}
