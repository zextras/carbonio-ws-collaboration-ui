/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
// @ts-expect-error
import selfie_segmentation_binarypb from '@mediapipe/selfie_segmentation/selfie_segmentation.binarypb';
// @ts-expect-error
import selfie_segmentation from '@mediapipe/selfie_segmentation/selfie_segmentation.tflite';
// @ts-expect-error
import selfie_segmentation_landscape from '@mediapipe/selfie_segmentation/selfie_segmentation_landscape.tflite';
// @ts-expect-error
import selfie_segmentation_solution_simd_wasm_bin from '@mediapipe/selfie_segmentation/selfie_segmentation_solution_simd_wasm_bin';
// @ts-expect-error
import selfie_segmentation_solution_simd_wasm_bin_wasm from '@mediapipe/selfie_segmentation/selfie_segmentation_solution_simd_wasm_bin.wasm';

export interface ISelfieSegmentation {
	setResultsCallback(callback: (results: Results) => void): void;
	initialize(): Promise<void>;
	send(input: HTMLVideoElement | null): Promise<void>;
	close(): void;
}

export default class SelfieSegmentationManager implements ISelfieSegmentation {
	private onResultsCallback: ((results: Results) => void) | undefined;

	private selfieSegmentation: SelfieSegmentation | null;

	constructor() {
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

	public setResultsCallback(callback: (results: Results) => void): void {
		this.onResultsCallback = callback;
	}

	public async initialize(): Promise<void> {
		try {
			await this.selfieSegmentation?.initialize();
		} catch (error) {
			console.error('Error during selfieSegmentation initialization: ', error);
		}
	}

	public async send(input: HTMLVideoElement | null): Promise<void> {
		if (input) {
			await this.selfieSegmentation?.send({ image: input });
		}
	}

	public async close(): Promise<void> {
		try {
			if (this.selfieSegmentation) {
				await this.selfieSegmentation.close();
				this.selfieSegmentation = null;
			}
		} catch (error) {
			console.error('Error during selfieSegmentation closing: ', error);
		}
	}
}
