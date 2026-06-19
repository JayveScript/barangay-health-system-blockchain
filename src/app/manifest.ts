import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kalyo - Barangay Health Center Blockchain System",
    short_name: "Kalyo",
    description: "KALYO — Kalusugan At Ligtas Yang Obyektibo. Secure blockchain-backed portal for the Barangay Health Center System.",
    id: "/",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#5BA8CB",
    theme_color: "#4E9EC4",
    icons: [
      { src: "/icons/icon-192.png",          sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png",          sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
