const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: '/',
  devServer: {
    historyApiFallback: true,
    proxy: {
      '^/api': {
        target: process.env.PUBLICATIONS_API_PROXY || 'http://localhost:5174',
        changeOrigin: true
      }
    }
  }
})
