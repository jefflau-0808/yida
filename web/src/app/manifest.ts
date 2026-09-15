import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "衣搭 YIDA",
    short_name: "衣搭",
    description: "从一件上衣开始，发现新的搭配可能。",
    start_url: "/",
    display: "standalone",
    background_color: "#fafbf8",
    theme_color: "#20221f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
