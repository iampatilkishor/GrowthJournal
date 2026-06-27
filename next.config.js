/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove better-sqlite3 from server bundle (legacy, no longer used)
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: ["ca3a-106-78-7-54.ngrok-free.app"],
};
module.exports = nextConfig;
