import getConfig from 'af-webpack/getConfig';
import assert from 'assert';
import nodeExternals from 'webpack-node-externals';

export default function(service, opts = {}) {
  const { ssr } = opts;
  const { config } = service;

  const afWebpackOpts = service.applyPlugins('modifyAFWebpackOpts', {
    initialValue: {
      cwd: service.cwd,
    },
    args: {
      ssr,
    },
  });

  assert(
    !('chainConfig' in afWebpackOpts),
    `chainConfig should not supplied in modifyAFWebpackOpts`,
  );
  afWebpackOpts.chainConfig = webpackConfig => {
    service.applyPlugins('chainWebpackConfig', {
      args: webpackConfig,
    });
    if (config.chainWebpack) {
      config.chainWebpack(webpackConfig, {
        webpack: require('af-webpack/webpack'),
      });
    }
  };

  const webpackConfig = service.applyPlugins('modifyWebpackConfig', {
    initialValue: getConfig({
      ...afWebpackOpts,
      ssr: true,
    }),
  });

  if (ssr) {
    webpackConfig.externals = nodeExternals({
      whitelist: /\.(css|less|sass|scss)$/,
    });
    webpackConfig.output.libraryTarget = 'commonjs2';
    webpackConfig.output.filename = '[name].server.js';
    webpackConfig.output.chunkFilename = '[name].server.async.js';
    webpackConfig.plugins.push(new (require('write-file-webpack-plugin'))());
  }

  return webpackConfig;
}
