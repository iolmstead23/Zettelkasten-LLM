/** @type {import('next').NextConfig} */
const nextConfig = {
  resolve: {
    fallback: {
      fs: false // This line is added to handle 'fs' module for browser
    }
  }
}

module.export = nextConfig;