/*
 * Direct build script to bypass SDK's yargs ESM issue
 */
const webpack = require('webpack');
const { rmSync } = require('node:fs');
const { setupWebpackBuildConfig } = require('./node_modules/@zextras/carbonio-ui-sdk/scripts/configs/webpack.build.config');
const { commitHash } = require('./node_modules/@zextras/carbonio-ui-sdk/scripts/utils/setup');
const { pkg } = require('./node_modules/@zextras/carbonio-ui-sdk/scripts/utils/pkg');

const options = {
	name: pkg.name,
	analyze: false,
	dev: false,
	external: false,
	pkgRel: '1'
};

const basePath = `/static/iris/${options.name}/${commitHash}/`;

console.log('Building', options.name);
console.log('Using base path', basePath);
console.log('Commit hash:', commitHash);

rmSync('dist', { recursive: true, force: true });

const config = setupWebpackBuildConfig(options, { basePath, commitHash });
const compiler = webpack(config);

compiler.run((err, stats) => {
	if (err) {
		console.error('Build failed:', err);
		process.exit(1);
	}

	if (stats.hasErrors()) {
		console.error('Build completed with errors:');
		console.error(stats.toString({ colors: true }));
		process.exit(1);
	}

	console.log(stats.toString({
		colors: true,
		modules: false,
		children: false,
		chunks: false,
		chunkModules: false
	}));

	console.log('\nBuild completed successfully!');
	compiler.close((closeErr) => {
		if (closeErr) {
			console.error('Error closing compiler:', closeErr);
		}
		process.exit(0);
	});
});
