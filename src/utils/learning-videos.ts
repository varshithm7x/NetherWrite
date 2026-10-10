import type { LearningVideo, QuizPerformance } from "../types/learning-reports";
import { isFlashcardRecord as isRecord, isFlashcardText as text } from "./flashcard-decks";
import { focusTopics } from "./learning-performance";
import { v4 as uuidv4 } from "uuid";
import { getAPI } from "./api";

export const MAX_LEARNING_VIDEOS = 6;
export const VIDEO_UNAVAILABLE_MESSAGE = "Video recommendations are unavailable: YouTube discovery is not connected. Your learning report remains available.";
export const YOUTUBE_RESTART_MESSAGE = "Close and restart NetherWrite to activate YouTube. In development, stop the running npm run dev command with Ctrl+C, then run npm run dev again.";
export function isMissingYouTubeHandler(error: unknown): boolean {
  return error instanceof Error && /No handler registered for ['"]youtube:(?:status|saveKey|useSessionKey|disconnect|search|cancel)['"]/.test(error.message);
}

export function validYouTubeUrl(url: unknown, id: string): url is string {
  if (typeof url !== "string" || !/^[\w-]{11}$/.test(id)) return false;
  return url === `https://www.youtube.com/watch?v=${id}`;
}
export function validYouTubeThumbnail(value: unknown, id: string): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.search && !url.hash
      && ["i.ytimg.com", "img.youtube.com"].includes(url.hostname)
      && new RegExp(`^/vi(?:_webp)?/${id}/[a-zA-Z0-9_-]+\.(?:jpg|webp)$`).test(url.pathname);
  } catch { return false; }
}
export function parseLearningVideo(value: unknown, topics: Set<string>): LearningVideo | null {
  if (!isRecord(value) || !text(value.id, 11) || !/^[\w-]{11}$/.test(value.id) || !text(value.title, 500)
    || !validYouTubeUrl(value.url, value.id) || !text(value.topic, 240) || !topics.has(value.topic)
    || (value.channel !== undefined && !text(value.channel, 300))) return null;
  return { id: value.id, title: value.title, url: value.url, topic: value.topic,
    ...(typeof value.channel === "string" ? { channel: value.channel } : {}),
    ...(validYouTubeThumbnail(value.thumbnail, value.id) ? { thumbnail: value.thumbnail } : {}) };
}

/** Only explicit opt-in connects this adapter to the authenticated native bridge. */
export type YouTubeDiscovery = (query: string, signal: AbortSignal) => Promise<unknown>;
export function nativeYouTubeDiscovery(): YouTubeDiscovery | undefined {
  const youtube = getAPI().youtube;
  if (!youtube) return undefined;
  let connection: Promise<{ configured: boolean; secureStorage: boolean; sessionOnly?: boolean }> | undefined;
  return async (query, signal) => {
    if (signal.aborted) throw new Error("Discovery cancelled");
    connection ??= youtube.status();
    const status = await connection;
    if (signal.aborted) throw new Error("Discovery cancelled");
    if (!status.configured || (!status.secureStorage && !status.sessionOnly)) throw new Error("YouTube discovery is not connected. Save your Data API key first.");
    const id = uuidv4();
    const cancel = () => { void youtube.cancel(id).catch(() => {}); };
    signal.addEventListener("abort", cancel, { once: true });
    try { return await youtube.search(query, id, true); }
    finally { signal.removeEventListener("abort", cancel); }
  };
}
export function learningVideoQueries(performance: QuizPerformance): string[] {
  return focusTopics(performance).slice(0, 3).map(topic => topic.topic)
    .filter(topic => topic.length <= 120 && !/[@/\\\r\n\x00-\x1f]/.test(topic)).map(topic => `${topic} tutorial`);
}
function safeDiscoveryFailure(error: unknown): string {
  if (isMissingYouTubeHandler(error)) return YOUTUBE_RESTART_MESSAGE;
  const message = error instanceof Error ? error.message : "";
  const known = ["YouTube rejected the request. Check API access, key restrictions and quota in Google Cloud.",
    "YouTube rejected your API key. Check YouTube Data API v3 is enabled.", "YouTube discovery is not connected. Save your Data API key first.",
    "YouTube search timed out or was cancelled. Your performance report remains available.", "YouTube search is unavailable. Check your connection and retry."];
  return known.find(value => message === value || message.endsWith(`Error: ${value}`)) || "YouTube search is unavailable. Your performance report remains available; please retry later.";
}
export async function discoverLearningVideos(performance: QuizPerformance, signal: AbortSignal, discovery?: YouTubeDiscovery, allowedQueries?: string[]): Promise<{
  videos: LearningVideo[]; status: "ready" | "unavailable" | "empty"; message?: string;
}> {
  if (!discovery) return { videos: [], status: "unavailable" };
  const topics = focusTopics(performance).slice(0, 3);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  const timer = setTimeout(abort, 8000);
  const videos: LearningVideo[] = [];
  const seen = new Set<string>();
  let failed = false;
  let message: string | undefined;
  try {
    for (const { topic } of topics) {
      // Only concise topic queries cross this boundary; never note paths or answers.
      if (!learningVideoQueries(performance).includes(`${topic} tutorial`) || (allowedQueries && !allowedQueries.includes(`${topic} tutorial`))) continue;
      const raw = await Promise.race([
        discovery(`${topic} tutorial`, controller.signal),
        new Promise<never>((_resolve, reject) => {
          if (controller.signal.aborted) reject(new Error("Discovery cancelled"));
          else controller.signal.addEventListener("abort", () => reject(new Error("Discovery cancelled")), { once: true });
        }),
      ]);
      if (controller.signal.aborted || !isRecord(raw) || !Array.isArray(raw.items)) throw new Error("Invalid discovery response");
      let topicCount = 0;
      for (const item of raw.items.slice(0, 20)) {
        if (!isRecord(item) || !isRecord(item.id) || !isRecord(item.snippet) || item.id.kind !== "youtube#video") continue;
        const snippet = item.snippet;
        const thumbnails = isRecord(snippet.thumbnails) ? snippet.thumbnails : {};
        const thumbnail = [thumbnails.high, thumbnails.medium, thumbnails.default].find(candidate =>
          isRecord(candidate) && typeof item.id === "object" && validYouTubeThumbnail(candidate.url, String((item.id as Record<string, unknown>).videoId)));
        const video = parseLearningVideo({ id: item.id.videoId, title: snippet.title, channel: snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`, topic, thumbnail: isRecord(thumbnail) ? thumbnail.url : undefined }, new Set([topic]));
        if (video && !seen.has(video.id)) { videos.push(video); seen.add(video.id); topicCount++; }
        if (topicCount === 2 || videos.length === MAX_LEARNING_VIDEOS) break;
      }
      if (videos.length === MAX_LEARNING_VIDEOS) break;
    }
  } catch (error) { failed = true; message = safeDiscoveryFailure(error); }
  finally { clearTimeout(timer); signal.removeEventListener("abort", abort); controller.abort(); }
  return { videos, status: videos.length ? "ready" : failed ? "unavailable" : "empty", ...(message ? { message } : {}) };
}
