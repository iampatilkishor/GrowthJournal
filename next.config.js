/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove better-sqlite3 from server bundle (legacy, no longer used)
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: [
    "10.77.153.64",
    "9d6d-2402-8100-2818-ea8f-78e2-f20a-e2ba-cc42.ngrok-free.app",
  ],
};
module.exports = nextConfig;
