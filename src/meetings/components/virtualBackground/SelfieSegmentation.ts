/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import selfie_segmentation_binarypb from '@mediapipe/selfie_segmentation/selfie_segmentation.binarypb';
import selfie_segmentation from '@mediapipe/selfie_segmentation/selfie_segmentation.tflite';
import selfie_segmentation_landscape from '@mediapipe/selfie_segmentation/selfie_segmentation_landscape.tflite';
import selfie_segmentation_solution_simd_wasm_bin from '@mediapipe/selfie_segmentation/selfie_segmentation_solution_simd_wasm_bin';
import selfie_segmentation_solution_simd_wasm_bin_wasm from '@mediapipe/selfie_segmentation/selfie_segmentation_solution_simd_wasm_bin.wasm';

export interface ISelfieSegmentation {
	initialize(): Promise<void>;
	send(input: HTMLVideoElement | null): Promise<void>;
}

export default class SelfieSegmentationManager implements ISelfieSegmentation {
	private readonly onResultsCallback: (results: Results) => void;

	private selfieSegmentation: SelfieSegmentation;

	constructor(onResultsCallback: (results: Results) => void) {
		this.onResultsCallback = onResultsCallback;

		this.selfieSegmentation = new SelfieSegmentation({
			locateFile: (file: string): string => {
				switch (file) {
					case 'selfie_segmentation_landscape.tflite':
						return selfie_segmentation_landscape;
					case 'selfie_segmentation_solution_simd_wasm_bin.js':
						return selfie_segmentation_solution_simd_wasm_bin;
					case 'selfie_segmentation.binarypb':
						return selfie_segmentation_binarypb;
					case 'selfie_segmentation_solution_simd_wasm_bin.wasm':
						return selfie_segmentation_solution_simd_wasm_bin_wasm;
					case 'selfie_segmentation.tflite':
						return selfie_segmentation;
					default: {
						console.error('Unknown file requested:', file);
						return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
					}
				}
			}
		});

		this.selfieSegmentation.setOptions({
			modelSelection: 1
		});

		this.selfieSegmentation.onResults(this.handleResults.bind(this));
	}

	private handleResults(results: Results): void {
		if (this.onResultsCallback) {
			this.onResultsCallback(results);
		}
	}

	public async initialize(): Promise<void> {
		try {
			await this.selfieSegmentation.initialize();
		} catch (error) {
			console.error('Error douring selfieSegmentation initialization: ', error);
		}
	}

	public async send(input: HTMLVideoElement | null): Promise<void> {
		if (input) {
			await this.selfieSegmentation.send({ image: input });
		}
	}
}
