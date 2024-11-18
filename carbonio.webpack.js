/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const path = require('path');

module.exports = function (wpConf) {
	// eslint-disable-next-line no-param-reassign
	wpConf.resolve.alias['app-entrypoint'] = `${__dirname}/src/app.tsx`;
	wpConf.module.rules.push({
		include: path.resolve(__dirname, 'node_modules/@mediapipe/selfie_segmentation'),
		exclude: path.resolve(
			__dirname,
			'node_modules/@mediapipe/selfie_segmentation/selfie_segmentation.js'
		),
		test: /\.(tflite|binarypb|wasm|js)$/,
		type: 'asset/resource'
	});
	return wpConf;
};
