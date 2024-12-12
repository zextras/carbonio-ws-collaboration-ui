/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MutableRefObject, useCallback, useMemo } from 'react';

import { Results } from '@mediapipe/selfie_segmentation';

import Coworking from '../meetings/assets/virtualBackgrounds/Coworking.png';
import Home from '../meetings/assets/virtualBackgrounds/Home.png';
import Ivy from '../meetings/assets/virtualBackgrounds/Ivy.png';
import JalMahal from '../meetings/assets/virtualBackgrounds/JalMahal.png';
import LivingRoom from '../meetings/assets/virtualBackgrounds/LivingRoom.png';
import Mountains from '../meetings/assets/virtualBackgrounds/Mountains.png';
import Office from '../meetings/assets/virtualBackgrounds/Office.png';
import { VirtualBackgroundType } from '../types/store/ActiveMeetingTypes';
import { BrowserUtils } from '../utils/BrowserUtils';

const useVirtualBackground = (
	backgroundSelected?: VirtualBackgroundType,
	canvasRefs?: MutableRefObject<HTMLCanvasElement | null>
): {
	paintStreamWithBlur: (results: Results) => void;
	paintStreamWithBackground: (results: Results) => void;
	virtualBackgroundImages: Record<VirtualBackgroundType, string>;
} => {
	const virtualBackgroundImages: Record<VirtualBackgroundType, string> = useMemo(
		() => ({
			[VirtualBackgroundType.NONE]: '',
			[VirtualBackgroundType.BLUR]: '',
			[VirtualBackgroundType.HOME]: Home,
			[VirtualBackgroundType.JAL_MAHAL]: JalMahal,
			[VirtualBackgroundType.LIVING_ROOM]: LivingRoom,
			[VirtualBackgroundType.MOUNTAINS]: Mountains,
			[VirtualBackgroundType.OFFICE]: Office,
			[VirtualBackgroundType.COWORKING]: Coworking,
			[VirtualBackgroundType.IVY]: Ivy
		}),
		[]
	);

	const backgroundImageSelected = useMemo(() => {
		const img = new Image();
		if (backgroundSelected !== undefined) {
			img.src = virtualBackgroundImages[backgroundSelected];
		}
		return img;
	}, [virtualBackgroundImages, backgroundSelected]);

	const paintStreamWithBlur = useCallback(
		(results: Results) => {
			const canvas = canvasRefs?.current;
			if (canvas) {
				const context = canvas.getContext('2d');
				if (context) {
					// setup canvas width and height to be the same as the results one
					context.canvas.width = 640;
					if (BrowserUtils.isFirefox()) {
						context.canvas.height = 480;
					} else {
						context.canvas.height = 360;
					}

					// Clear the canvas
					context.clearRect(0, 0, canvas.width, canvas.height);

					// Draw the segmentation mask
					context.save();
					context.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

					// Apply blur effect
					context.globalCompositeOperation = 'source-out';
					context.filter = 'blur(10px)';
					context.drawImage(results.image, 0, 0, results.image.width, results.image.height);
					context.filter = 'none';
					context.globalCompositeOperation = 'destination-atop';
					context.drawImage(results.image, 0, 0, results.image.width, results.image.height);
					context.restore();
				}
			}
		},
		[canvasRefs]
	);

	const paintStreamWithBackground = useCallback(
		(results: Results) => {
			const canvas = canvasRefs?.current;
			if (canvas) {
				const context = canvas.getContext('2d', {
					preserveDrawingBuffer: true
				}) as CanvasRenderingContext2D | null;
				if (context) {
					// setup canvas width and height to be the same as the results one
					context.canvas.width = 640;
					if (BrowserUtils.isFirefox()) {
						context.canvas.height = 480;
					} else {
						context.canvas.height = 360;
					}

					// Clear the canvas
					context.clearRect(0, 0, canvas.width, canvas.height);

					context.save();
					context.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

					context.globalCompositeOperation = 'source-out';
					context.drawImage(
						backgroundImageSelected,
						0,
						0,
						results.image.width,
						results.image.height
					);

					context.globalCompositeOperation = 'destination-atop';
					context.drawImage(results.image, 0, 0, results.image.width, results.image.height);

					context.restore();
				}
			}
		},
		[backgroundImageSelected, canvasRefs]
	);

	return { paintStreamWithBlur, paintStreamWithBackground, virtualBackgroundImages };
};

export default useVirtualBackground;
