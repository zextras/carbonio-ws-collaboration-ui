/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	isPreviewSupported,
	getPreviewType,
	getAttachmentExtension,
	getAttachmentSize,
	getAttachmentDimensions,
	getAttachmentURL,
	getAttachmentThumbnailURL,
	canDisplayPreviewOnLoad,
	isAttachmentImage,
	isAttachmentVideo,
	getAttachmentType,
	getApplicationIcon,
	getAttachmentIcon,
	getMimeTypeCategory,
	getMediaGalleryBucketKey,
	attachmentMatchesFilter,
	AttachmentType
} from './attachmentUtils';
import { Attachment } from '../types/network/models/attachmentTypes';
import { AttachmentMessageType } from '../types/store/ChatsRegistryTypes';

const enum MimeTypes {
	JPEG = 'image/jpeg',
	PNG = 'image/png',
	GIF = 'image/gif',
	PDF = 'application/pdf',
	VND_MS_EXCEL = 'application/vnd.ms-excel',
	X_ZIP = 'application/x-zip',
	MP4 = 'video/mp4',
	WEBM = 'video/webm',
	OGG = 'video/ogg',
	QUICKTIME = 'video/quicktime',
	MKV = 'video/x-matroska'
}

describe('attachmentUtils tests', () => {
	describe('isPreviewSupported', () => {
		test('Preview is supported for image/jpeg', () => {
			expect(isPreviewSupported(MimeTypes.JPEG)).toBe(true);
		});

		test('Preview is supported for image/gif', () => {
			expect(isPreviewSupported('image/gif')).toBe(true);
		});

		test('Preview is supported for application/pdf', () => {
			expect(isPreviewSupported(MimeTypes.PDF)).toBe(true);
		});

		test('Preview is not supported for application/vnd.ms-excel', () => {
			expect(isPreviewSupported(MimeTypes.VND_MS_EXCEL)).toBe(false);
		});

		test.each([MimeTypes.MP4, MimeTypes.WEBM, MimeTypes.OGG, MimeTypes.QUICKTIME])(
			'Preview is supported for whitelisted video %s',
			(mime) => {
				expect(isPreviewSupported(mime)).toBe(true);
			}
		);

		test('Preview is not supported for non-whitelisted video formats', () => {
			expect(isPreviewSupported(MimeTypes.MKV)).toBe(false);
		});
	});

	describe('getPreviewType', () => {
		test('returns the correct preview type for supported mime', () => {
			expect(getPreviewType('image/webp')).toBe(AttachmentType.JPEG);
		});

		test('returns the correct preview type for PDF', () => {
			expect(getPreviewType(MimeTypes.PDF)).toBe(AttachmentType.JPEG);
		});

		test('defaults to JPEG for unknown mime types', () => {
			expect(getPreviewType('unknown/type')).toBe(AttachmentType.JPEG);
		});
	});

	describe('getAttachmentExtension', () => {
		test('returns the correct extension when mime is found', () => {
			expect(getAttachmentExtension(MimeTypes.PDF)).toBe(AttachmentType.PDF);
		});

		test('returns the second part of the mime if not found in the supported list', () => {
			expect(getAttachmentExtension('application/x-custom')).toBe('x-custom');
		});

		test('returns an empty string if the mime is undefined', () => {
			expect(getAttachmentExtension(undefined)).toBe('');
		});
	});

	describe('getAttachmentSize', () => {
		test('formats byte sizes into human-readable units', () => {
			expect(getAttachmentSize(500)).toBe('500B');
			expect(getAttachmentSize(2048)).toBe('2.00KB');
			expect(getAttachmentSize(5 * 1024 * 1024)).toBe('5.00MB');
			expect(getAttachmentSize(3 * 1024 * 1024 * 1200)).toBe('3.52GB');
		});

		test('returns an empty string for undefined sizes', () => {
			expect(getAttachmentSize(undefined)).toBe('');
		});
	});

	describe('getAttachmentDimensions', () => {
		test('Dimensions are correctly parsed from the area string', () => {
			const result = getAttachmentDimensions({
				mimeType: MimeTypes.PNG,
				area: '100x200'
			} as AttachmentMessageType);
			expect(result).toEqual({ width: 100, height: 200 });
		});

		test('Defaults dimensions to 2480x3508 for PDFs', () => {
			const result = getAttachmentDimensions({ mimeType: MimeTypes.PDF } as AttachmentMessageType);
			expect(result).toEqual({ width: 2480, height: 3508 });
		});
	});

	describe('getAttachmentURL', () => {
		test('returns undefined if the mime type does not support preview', () => {
			expect(getAttachmentURL('id', MimeTypes.X_ZIP)).toBeUndefined();
		});

		test('returns a PDF preview URL if the file is a PDF', () => {
			const url = getAttachmentURL('pdf-id', MimeTypes.PDF);
			expect(url).toContain('pdf-id');
		});

		test('returns an image preview URL for other supported types', () => {
			const url = getAttachmentURL('img-id', MimeTypes.PNG);
			expect(url).toContain('img-id');
		});

		test('returns the raw download URL for whitelisted videos', () => {
			const url = getAttachmentURL('video-id', MimeTypes.MP4);
			expect(url).toContain('video-id');
			expect(url).toContain('/attachments/');
			expect(url).toContain('/download');
		});

		test('returns undefined for non-whitelisted video formats', () => {
			expect(getAttachmentURL('mkv-id', MimeTypes.MKV)).toBeUndefined();
		});
	});

	describe('getAttachmentThumbnailURL', () => {
		test('returns the correct thumbnail URL for PDF', () => {
			const url = getAttachmentThumbnailURL('pdf-id', MimeTypes.PDF);
			expect(url).toContain('pdf-id');
		});

		test('returns the correct thumbnail URL for images', () => {
			const url = getAttachmentThumbnailURL('img-id', MimeTypes.PNG);
			expect(url).toContain('img-id');
		});

		test('returns undefined for videos so the icon is shown instead', () => {
			expect(getAttachmentThumbnailURL('video-id', MimeTypes.MP4)).toBeUndefined();
		});
	});

	describe('canDisplayPreviewOnLoad', () => {
		test('returns true for image mime types', () => {
			expect(canDisplayPreviewOnLoad(MimeTypes.JPEG)).toBe(true);
		});

		test('returns false for non-image mime types', () => {
			expect(canDisplayPreviewOnLoad(MimeTypes.PDF)).toBe(false);
		});
	});

	describe('isAttachmentImage', () => {
		test('returns true when the mime type indicates an image', () => {
			expect(isAttachmentImage(MimeTypes.JPEG)).toBe(true);
		});

		test('returns false for non-image mime types', () => {
			expect(isAttachmentImage(MimeTypes.PDF)).toBe(false);
		});
	});

	describe('isAttachmentVideo', () => {
		test('returns true for any video/* mime type', () => {
			expect(isAttachmentVideo(MimeTypes.MP4)).toBe(true);
			expect(isAttachmentVideo(MimeTypes.MKV)).toBe(true);
		});

		test('returns false for non-video mime types', () => {
			expect(isAttachmentVideo(MimeTypes.PNG)).toBe(false);
			expect(isAttachmentVideo(MimeTypes.PDF)).toBe(false);
		});
	});

	describe('getAttachmentType', () => {
		test('returns "image" when the mime type is an image', () => {
			expect(getAttachmentType(MimeTypes.PNG)).toBe('image');
		});

		test('returns "video" when the mime type is a video', () => {
			expect(getAttachmentType(MimeTypes.MP4)).toBe('video');
		});

		test('returns "pdf" for non-image, non-video types', () => {
			expect(getAttachmentType(MimeTypes.PDF)).toBe('pdf');
		});
	});

	describe('getApplicationIcon', () => {
		test('returns the correct icon for pdf', () => {
			expect(getApplicationIcon(MimeTypes.PDF)).toBe('FilePdfOutline');
		});

		test('returns the correct icon for ppt', () => {
			expect(getApplicationIcon('application/powerpoint')).toBe('FilePresentationOutline');
		});

		test('returns the correct icon for zip', () => {
			expect(getApplicationIcon(MimeTypes.X_ZIP)).toBe('FileZipOutline');
		});

		test('returns the correct icon for excel', () => {
			expect(getApplicationIcon(MimeTypes.VND_MS_EXCEL)).toBe('FileCalcOutline');
		});

		test('falls back to FileAppOutline when the subtype is unknown', () => {
			expect(getApplicationIcon('application/unknown')).toBe('FileAppOutline');
		});
	});

	describe('getAttachmentIcon', () => {
		test('returns the correct icon for image types', () => {
			expect(getAttachmentIcon(MimeTypes.PNG)).toBe('FileImageOutline');
		});

		test('delegates to getApplicationIcon for application types', () => {
			expect(getAttachmentIcon(MimeTypes.PDF)).toBe('FilePdfOutline');
		});
	});

	describe('getMimeTypeCategory', () => {
		test('returns IMAGES for image mime types', () => {
			expect(getMimeTypeCategory(MimeTypes.PNG)).toBe('IMAGES');
			expect(getMimeTypeCategory(MimeTypes.JPEG)).toBe('IMAGES');
		});

		test('returns VIDEOS for any video mime type', () => {
			expect(getMimeTypeCategory(MimeTypes.MP4)).toBe('VIDEOS');
			expect(getMimeTypeCategory(MimeTypes.MKV)).toBe('VIDEOS');
		});

		test('returns DOCUMENTS for everything else, audio included', () => {
			expect(getMimeTypeCategory(MimeTypes.PDF)).toBe('DOCUMENTS');
			expect(getMimeTypeCategory('audio/mpeg')).toBe('DOCUMENTS');
			expect(getMimeTypeCategory('text/plain')).toBe('DOCUMENTS');
		});
	});

	describe('getMediaGalleryBucketKey', () => {
		test('returns the same key regardless of the property order', () => {
			const keyA = getMediaGalleryBucketKey({ userId: 'user-1', mimeTypeCategory: 'IMAGES' });
			const keyB = getMediaGalleryBucketKey({ mimeTypeCategory: 'IMAGES', userId: 'user-1' });
			expect(keyA).toBe(keyB);
		});

		test('skips undefined values', () => {
			const keyA = getMediaGalleryBucketKey({ mimeTypeCategory: 'IMAGES', userId: undefined });
			const keyB = getMediaGalleryBucketKey({ mimeTypeCategory: 'IMAGES' });
			expect(keyA).toBe(keyB);
		});

		test('different filters produce different keys', () => {
			const keyA = getMediaGalleryBucketKey({ mimeTypeCategory: 'IMAGES' });
			const keyB = getMediaGalleryBucketKey({ mimeTypeCategory: 'VIDEOS' });
			expect(keyA).not.toBe(keyB);
		});
	});

	describe('attachmentMatchesFilter', () => {
		const attachment: Attachment = {
			id: 'attachment-id',
			name: 'photo.png',
			size: 2048,
			mimeType: MimeTypes.PNG,
			userId: 'user-1',
			roomId: 'room-1',
			createdAt: '2026-07-10T10:00:00.000Z'
		};

		test('an empty filter matches any attachment', () => {
			expect(attachmentMatchesFilter(attachment, {})).toBe(true);
		});

		test('matches on the mime type category', () => {
			expect(attachmentMatchesFilter(attachment, { mimeTypeCategory: 'IMAGES' })).toBe(true);
			expect(attachmentMatchesFilter(attachment, { mimeTypeCategory: 'VIDEOS' })).toBe(false);
		});

		test('matches on the exact mime type', () => {
			expect(attachmentMatchesFilter(attachment, { mimeType: MimeTypes.PNG })).toBe(true);
			expect(attachmentMatchesFilter(attachment, { mimeType: MimeTypes.JPEG })).toBe(false);
		});

		test('matches on the sender', () => {
			expect(attachmentMatchesFilter(attachment, { userId: 'user-1' })).toBe(true);
			expect(attachmentMatchesFilter(attachment, { userId: 'user-2' })).toBe(false);
		});

		test('createdAfter and createdBefore boundaries are inclusive', () => {
			expect(attachmentMatchesFilter(attachment, { createdAfter: attachment.createdAt })).toBe(
				true
			);
			expect(attachmentMatchesFilter(attachment, { createdBefore: attachment.createdAt })).toBe(
				true
			);
			expect(
				attachmentMatchesFilter(attachment, { createdAfter: '2026-07-11T00:00:00.000Z' })
			).toBe(false);
			expect(
				attachmentMatchesFilter(attachment, { createdBefore: '2026-07-09T00:00:00.000Z' })
			).toBe(false);
		});

		test('minSize and maxSize boundaries are inclusive and 0 is a valid minSize', () => {
			expect(attachmentMatchesFilter(attachment, { minSize: 2048, maxSize: 2048 })).toBe(true);
			expect(attachmentMatchesFilter(attachment, { minSize: 0 })).toBe(true);
			expect(attachmentMatchesFilter(attachment, { minSize: 4096 })).toBe(false);
			expect(attachmentMatchesFilter(attachment, { maxSize: 1024 })).toBe(false);
		});
	});
});
