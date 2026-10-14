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
	// With the websocket proxy enabled (sdk watch -w) the catch-all proxy also grabs the
	// dev server live reload socket, so the backend corrupts it and it reconnects forever
	const catchAllProxy = wpConf.devServer?.proxy?.[0];
	if (catchAllProxy?.ws) {
		catchAllProxy.context.push('!/ws');
	}
	// The backend builds redirects (e.g. to /static/login/) from the Host header without its
	// port, so they would leave the dev server and land on https://localhost/
	if (catchAllProxy) {
		catchAllProxy.onProxyRes = (proxyRes, req) => {
			const { location } = proxyRes.headers;
			if (!location || !req.headers.host) return;
			const redirectUrl = new URL(location, `https://${req.headers.host}`);
			const devServerUrl = new URL(`https://${req.headers.host}`);
			if (
				redirectUrl.hostname === devServerUrl.hostname &&
				redirectUrl.port !== devServerUrl.port
			) {
				redirectUrl.port = devServerUrl.port;
				// eslint-disable-next-line no-param-reassign
				proxyRes.headers.location = redirectUrl.toString();
			}
		};
	}
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
