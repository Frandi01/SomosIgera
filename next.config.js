// Mismo criterio que DAIA: si algo llegara a meter código en una página, no puede traer
// scripts de afuera ni mandar datos a otro dominio. 'unsafe-inline' hace falta por los scripts
// propios de Next y de la landing; en desarrollo Next necesita 'unsafe-eval', así que va solo
// en producción. Los únicos iframes permitidos son los videos de YouTube de los cursos.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
module.exports = {
  poweredByHeader: false,
  async headers() {
    const base = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ];
    if (process.env.NODE_ENV === "production") base.push({ key: "Content-Security-Policy", value: CSP });
    return [{ source: "/:path*", headers: base }];
  },
};
