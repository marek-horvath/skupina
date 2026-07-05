const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/skupina/' : '/',
  devServer: {
    historyApiFallback: true,
    proxy: {
      '^/api': {
        target: process.env.PUBLICATIONS_API_PROXY || 'http://127.0.0.1:5174',
        changeOrigin: true
      }
    }
  }
})
