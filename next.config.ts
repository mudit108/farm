import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lib/certificate.tsx loads a font file via a dynamic path.join() call
  // (Font.register), which Next's file tracer can't discover through
  // static analysis alone — without this, the font would work in local
  // dev (whole project on disk) but silently be MISSING from the
  // deployed serverless function bundle on Vercel, breaking certificate
  // generation (specifically Hindi taglines) only in production.
  outputFileTracingIncludes: {
    "/api/certificate/download": ["./lib/fonts/**"],
    "/dashboard/select-plot": ["./lib/fonts/**"], // covers the payment Server Action bundle
    "/admin/registrations": ["./lib/fonts/**"], // covers the admin approval Server Action bundle
  },
};

export default nextConfig;
