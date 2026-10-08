/**
 * URL utility helpers for smart iframe embeds and URL formatting.
 */

export interface SmartEmbedConfig {
  src: string;
  attrs: {
    allow?: string;
    allowFullScreen?: boolean;
    style?: React.CSSProperties;
    sandbox?: string;
  };
  badge: string;
}

/**
 * Safely extracts the URL from an iframe or raw link, removing unwanted wrapping like prepended 'https://'
 */
export function cleanEmbedUrl(url: string): string {
  if (!url) return "";
  let clean = url.trim();

  // Handle cases where an iframe snippet was pasted (and potentially prepended with http/https)
  const iframeRegex = /<iframe[^>]+src=(["'])(.*?)\1/i;
  const match = clean.match(iframeRegex);
  if (match) {
    return match[2].trim();
  }

  return clean;
}

/**
 * Returns the smart iframe URL, attributes, and category badge for a given URL.
 */
export function getSmartEmbed(url: string): SmartEmbedConfig {
  const cleanUrl = cleanEmbedUrl(url).replace(/#no-embed/g, "").trim();

  // 1. YouTube
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/);
  if (ytMatch) {
    return {
      src: `https://www.youtube.com/embed/${ytMatch[1]}?vq=hd1080&rel=0`,
      attrs: {
        allow: "fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture",
        allowFullScreen: true,
      },
      badge: "YouTube",
    };
  }

  // 2. Spotify
  if (cleanUrl.includes("open.spotify.com/")) {
    const embedUrl = cleanUrl.includes("/embed/")
      ? cleanUrl
      : cleanUrl.replace("open.spotify.com/", "open.spotify.com/embed/");
    const isTrack = cleanUrl.includes("/track/");
    const height = isTrack ? "352px" : "380px";
    return {
      src: embedUrl,
      attrs: {
        allow: "encrypted-media",
        style: { borderRadius: "12px", height: height, maxWidth: "660px", width: "100%" },
      },
      badge: "Spotify",
    };
  }

  // 2b. Apple Music
  if (cleanUrl.includes("music.apple.com/")) {
    const embedUrl = cleanUrl.includes("embed.music.apple.com/")
      ? cleanUrl
      : cleanUrl.replace("music.apple.com/", "embed.music.apple.com/");
    return {
      src: embedUrl,
      attrs: {
        allow: "autoplay *; encrypted-media *; fullscreen *; clipboard-write",
        style: { borderRadius: "10px", height: "175px", maxWidth: "660px", width: "100%" },
      },
      badge: "Apple Music",
    };
  }

  // 3. Vimeo
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/video\/|vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    return {
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      attrs: {
        allow: "fullscreen; autoplay; picture-in-picture",
        allowFullScreen: true,
      },
      badge: "Vimeo",
    };
  }

  // 4. Other types
  let badge = "Web Page";
  if (cleanUrl.endsWith(".pdf") || cleanUrl.includes(".pdf?")) {
    badge = "PDF";
  } else if (cleanUrl.match(/\.(mp4|webm|ogg)(?:\?.*)?$/i)) {
    badge = "Video Player";
  } else if (cleanUrl.match(/\.(mp3|wav|ogg|m4a)(?:\?.*)?$/i)) {
    badge = "Audio Player";
  }

  return {
    src: cleanUrl,
    attrs: {
      allow: "fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture",
      allowFullScreen: true,
    },
    badge,
  };
}

/**
 * Returns the hostname of the URL, stripped of the leading 'www.'.
 */
export function getDisplayDomain(url: string): string {
  try {
    return new URL(cleanEmbedUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Toggles #no-embed in a markdown string for a given URL.
 */
export function toggleUrlInMarkdown(content: string, url: string, targetToLink: boolean): string {
  const cleanUrl = url.replace(/#no-embed/g, "").trim();
  const escapedUrl = cleanUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  if (targetToLink) {
    const regex = new RegExp(`(${escapedUrl})(?!\\s*#no-embed)`, "g");
    return content.replace(regex, `$1#no-embed`);
  } else {
    const regex = new RegExp(`${escapedUrl}\\s*#no-embed`, "g");
    return content.replace(regex, cleanUrl);
  }
}
