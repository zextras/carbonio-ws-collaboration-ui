/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const fs = require('fs');
const path = require('path');

module.exports = function (wpConf) {
	// eslint-disable-next-line no-param-reassign
	wpConf.resolve.alias['app-entrypoint'] = `${__dirname}/src/app.tsx`;
	// path.resolve returns the symlink path; under pnpm webpack follows symlinks so
	// the real path (inside node_modules/.pnpm/...) must be used for include/exclude
	// to match. fs.realpathSync resolves the symlink at config time.
	const mediapipeDir = fs.realpathSync(
		path.resolve(__dirname, 'node_modules/@mediapipe/selfie_segmentation')
	);
	wpConf.module.rules.push({
		include: mediapipeDir,
		exclude: path.join(mediapipeDir, 'selfie_segmentation.js'),
		test: /\.(tflite|binarypb|wasm|js)$/,
		type: 'asset/resource'
	});
	return wpConf;
};
