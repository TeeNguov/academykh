import type { Metadata } from "next";

export const SITE_NAME = "Academy KH";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://academykh.jaekjay.com";
export const SHARE_THUMBNAIL_PATH = "/share-test-thumbnail.png";

type ShareMetadataInput = {
  title: string;
  description: string;
  path: string;
  label?: string;
};

export function absoluteSiteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function buildShareMetadata({ title, description, path, label }: ShareMetadataInput): Metadata {
  const pageUrl = absoluteSiteUrl(path);
  const imageUrl = absoluteSiteUrl(SHARE_THUMBNAIL_PATH);
  const imageAlt = label ? `${label} - powered by ${SITE_NAME}` : `${SITE_NAME} learning platform`;

  return {
    title: {
      absolute: title
    },
    description,
    alternates: {
      canonical: pageUrl
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    }
  };
}
