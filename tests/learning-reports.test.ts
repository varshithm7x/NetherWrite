// @vitest-environment jsdom
import { TextEncoder } from "node:util";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { reportQuiz, reportFixture, reportAdvice, REPORT_NOTE, REPORT_PASSAGE } from "./fixtures/learning-reports";
import { analyzeQuizPerformance, learningPriority, performanceCounts } from "../src/utils/learning-performance";
import { parseLearningAdvice, parseLearningReport } from "../src/utils/learning-reports";
import { validYouTubeUrl, validYouTubeThumbnail, parseLearningVideo, discoverLearningVideos } from "../src/utils/learning-videos";
import { saveLearningReport, loadLearningReports, deleteLearningReport, renameReportSources } from "../src/utils/reportsStore";
import { generateLearningReport, loadNoteQuizPerformance, prepareReportEvidence, REPORT_ADVICE_TIMEOUT_MS } from "../src/utils/report-generation";
import type { ReportGenerationRequest } from "../src/utils/report-generation";
import { setCommentsVaultPath, answerQuizQuestion, loadComments } from "../src/utils/commentsStore";

const mocks = vi.hoisted(() => ({ vault: "/report-fixture-vault", disk: new Map<string, string>(), ask: vi.fn(), write: vi.fn(), config: vi.fn(), exists: vi.fn() }));
vi.mock("../src/utils/ai-core", () => ({ askAI: mocks.ask, AIProviderRequestError: class extends Error {} }));
vi.mock("../src/utils/ai-settings", () => ({ loadSettingsAsync: async () => ({}), loadAIConfig: mocks.config, getModelsForProvider: () => [{ id: "fixture-model" }] }));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({
  getVaultPath: async () => mocks.vault, fileExists: mocks.exists,
  dataRead: async (file: string) => mocks.disk.get(`${mocks.vault}:${file}`) ?? null, dataWrite: mocks.write,
}) }));
vi.mock("../src/utils/disk-store", () => ({
  readData: async (file: string) => JSON.parse(mocks.disk.get(`${mocks.vault}:${file}`) ?? "null"),
  writeData: async (file: string, data: unknown) => { mocks.disk.set(`${mocks.vault}:${file}`, JSON.stringify(data)); },
}));
vi.mock("../src/lib/auth", () => ({ authManager: { getUser: () => null } }));
Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder, configurable: true });
let request: ReportGenerationRequest;
beforeEach(() => {
  mocks.vault = "/report-fixture-vault"; mocks.disk.clear(); localStorage.clear();
  setCommentsVaultPath(null); setCommentsVaultPath(mocks.vault);
  mocks.config.mockReset().mockReturnValue({ provider: "openai", modelId: "fixture-model", apiKey: "test-only" });
  mocks.ask.mockReset().mockResolvedValue(JSON.stringify(reportAdvice()));
  mocks.exists.mockReset().mockImplementation(async (path: string) => mocks.disk.has(`${mocks.vault}:${path.replace(/^\.netherwrite\//, "")}`));
  mocks.write.mockReset().mockImplementation(async (file: string, data: string, options: { expectedVaultPath: string }) => {
    if (options.expectedVaultPath !== mocks.vault) throw new Error("Vault changed");
    mocks.disk.set(`${mocks.vault}:${file}`, data);
  });
  mocks.disk.set(`${mocks.vault}:comments.json`, JSON.stringify({ [REPORT_NOTE.path]: [reportQuiz(), reportQuiz("memory", "Memory", { q1: 0 })] }));
  request = { vaultPath: mocks.vault, note: REPORT_NOTE, signal: new AbortController().signal,
    isSourceAvailable: () => true, readNote: async () => ({ content: REPORT_PASSAGE, revision: REPORT_PASSAGE }) };
});
afterEach(() => { vi.useRealTimers(); });

it("counts correct, incorrect and unanswered with answered-only accuracy", () => {
  const performance = reportFixture().performance;
  expect(performance).toMatchObject({ total: 4, answered: 2, correct: 1, incorrect: 1, unanswered: 2, accuracy: 50 });
  expect(performance.topics).toMatchObject([{ topic: "Deadlocks", accuracy: 0, priority: "Needs Attention", limitedEvidence: true }, { topic: "Memory", accuracy: 100, priority: "Strong", limitedEvidence: true }]);
  expect(performance.questions[0]).toMatchObject({ commentId: "deadlocks", questionId: "q1", selectedIndex: 1, correctIndex: 0 });
});
it("calculates the requested twelve-total, ten-answered example without treating unanswered as wrong", () => {
  const quiz = reportQuiz();
  quiz.quiz.questions = Array.from({ length: 12 }, (_, index) => ({ ...quiz.quiz.questions[0], id: `question-${index}` }));
  quiz.quiz.answers = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`question-${index}`, index < 7 ? 0 : 1]));
  expect(analyzeQuizPerformance([quiz], REPORT_NOTE.path)).toMatchObject({ total: 12, answered: 10, correct: 7, incorrect: 3, unanswered: 2, accuracy: 70 });
});
it("groups multiple quiz comments for the same real topic", () => {
  const performance = analyzeQuizPerformance([reportQuiz(), reportQuiz("second", "Deadlocks", { q1: 0, q2: 0 })], REPORT_NOTE.path);
  expect(performance.topics).toHaveLength(1);
  expect(performance.topics[0]).toMatchObject({ answered: 3, correct: 2, accuracy: 67, priority: "Keep Practicing", limitedEvidence: false });
});
it("isolates sources and ignores ordinary, malformed and duplicated comments", () => {
  const performance = analyzeQuizPerformance([reportQuiz(), reportQuiz(), reportQuiz("other", "Other", { q1: 0 }, "Other.md"), { content: "ordinary" }, { type: "quiz", quiz: {} }], REPORT_NOTE.path);
  expect(performance.total).toBe(2); expect(performance.skippedQuizzes).toBe(2);
});
it.each([{}, { q1: 4 }, { missing: 0 }])("handles absent or invalid saved answers %j", answers => {
  const performance = analyzeQuizPerformance([reportQuiz("test", "Deadlocks", answers as never)], REPORT_NOTE.path);
  expect(performance.answered).toBe(0); expect(performance.accuracy).toBeNull();
});
it.each([[49, 100, "Needs Attention"], [50, 100, "Keep Practicing"], [79, 100, "Keep Practicing"], [80, 100, "Strong"], [0, 0, "Unanswered"], [39, 49, "Keep Practicing"]])("classifies exact ratio %i/%i as %s", (correct, answered, expected) => {
  expect(learningPriority({ total: answered as number, correct: correct as number, answered: answered as number, incorrect: 0, unanswered: 0, accuracy: 0 })).toBe(expected);
});
it("returns no accuracy for no attempts", () => { expect(performanceCounts([]).accuracy).toBeNull(); });

it("validates grounded advice for real weaker and strong topics", () => {
  expect(parseLearningAdvice(reportAdvice(), reportFixture().performance, REPORT_PASSAGE)).toEqual(reportAdvice());
});
it.each(["unknown-topic", "strong-focus", "weak-strength", "unsupported-quote", "invented-score", "missing-plan", "video-metadata"])("rejects invalid structured advice: %s", kind => {
  const advice = reportAdvice();
  if (kind === "unknown-topic") advice.focus[0].topic = "Invented";
  if (kind === "strong-focus") advice.focus[0].topic = "Memory";
  if (kind === "weak-strength") advice.strengths[0].topic = "Deadlocks";
  if (kind === "unsupported-quote") advice.focus[0].sourceExcerpt = "A quotation absent from the source.";
  if (kind === "invented-score") advice.assessment = "You mastered this topic with 100% accuracy.";
  if (kind === "missing-plan") advice.studyPlan = [];
  expect(parseLearningAdvice(kind === "video-metadata" ? { ...advice, videos: [] } : advice, reportFixture().performance, REPORT_PASSAGE)).toBeNull();
});
it("round-trips a valid report and rejects inconsistent snapshots", () => {
  const report = reportFixture(); expect(parseLearningReport(JSON.parse(JSON.stringify(report)))).toEqual(report);
  expect(parseLearningReport({ ...report, performance: { ...report.performance, accuracy: 99 } })).toBeNull();
  expect(parseLearningReport({ ...report, performance: { ...report.performance, topics: [] } })).toBeNull();
  expect(parseLearningReport({ ...report, advice: {}, adviceStatus: "ready" })).toBeNull();
});

const video = { id: "abcdefghijk", title: "Fixture tutorial", topic: "Deadlocks", url: "https://www.youtube.com/watch?v=abcdefghijk", channel: "Fixture channel", thumbnail: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg" };
it("validates video IDs, watch URLs and actual provider thumbnail URLs", () => {
  expect(parseLearningVideo(video, new Set(["Deadlocks"]))).toEqual(video);
  for (const url of ["javascript:alert(1)", "https://evil.test/watch?v=abcdefghijk", "https://www.youtube.com/watch?v=differentid", "https://www.youtube.com/watch?v=abcdefghijk&tracking=1"]) expect(validYouTubeUrl(url, video.id)).toBe(false);
  expect(parseLearningVideo({ ...video, id: "invalid" }, new Set(["Deadlocks"]))).toBeNull();
  expect(parseLearningVideo(video, new Set(["Other"]))).toBeNull();
  expect(validYouTubeThumbnail("https://evil.test/image.jpg", video.id)).toBe(false);
});
it.each([undefined, "https://evil.test/image.jpg", "http://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg"])("uses a thumbnail fallback instead of fabricating %s", thumbnail => {
  expect(parseLearningVideo({ ...video, thumbnail }, new Set(["Deadlocks"]))).toEqual({ ...video, thumbnail: undefined });
});
const discovered = (id = video.id) => ({ id: { kind: "youtube#video", videoId: id }, snippet: { title: video.title, channelTitle: video.channel, thumbnails: { high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } } } });
it("takes real-shaped discovery metadata, deduplicates IDs and sends only concise focus queries", async () => {
  const discovery = vi.fn().mockResolvedValue({ items: [discovered(), discovered(), discovered("lmnopqrstuv")] });
  const result = await discoverLearningVideos(reportFixture().performance, request.signal, discovery);
  expect(result.status).toBe("ready"); expect(result.videos).toHaveLength(2);
  expect(discovery).toHaveBeenCalledWith("Deadlocks tutorial", expect.any(AbortSignal));
  expect(JSON.stringify(discovery.mock.calls)).not.toContain(REPORT_NOTE.path);
  expect(result.videos[0]).toEqual(video);
});
it("does not send paths or personal identifiers as video queries", async () => {
  const performance = analyzeQuizPerformance([reportQuiz("private", "/private/email@example.test", { q1: 1 })], REPORT_NOTE.path);
  const discovery = vi.fn(); await discoverLearningVideos(performance, request.signal, discovery); expect(discovery).not.toHaveBeenCalled();
});
it("does not substitute topic queries that were not explicitly approved in the form", async () => {
  const discovery = vi.fn().mockResolvedValue({ items: [] });
  await discoverLearningVideos(reportFixture().performance, request.signal, discovery, ["Memory tutorial"]);
  expect(discovery).not.toHaveBeenCalled();
  await discoverLearningVideos(reportFixture().performance, request.signal, discovery, ["Deadlocks tutorial"]);
  expect(discovery).toHaveBeenCalledWith("Deadlocks tutorial", expect.any(AbortSignal));
});
it("handles disconnected, empty and failed video discovery", async () => {
  expect((await discoverLearningVideos(reportFixture().performance, request.signal)).status).toBe("unavailable");
  expect((await discoverLearningVideos(reportFixture().performance, request.signal, async () => ({ items: [] }))).status).toBe("empty");
  expect((await discoverLearningVideos(reportFixture().performance, request.signal, async () => { throw new Error("Offline"); })).status).toBe("unavailable");
});
it("explains a missing native YouTube handler rather than misreporting a network failure", async () => {
  const result = await discoverLearningVideos(reportFixture().performance, request.signal, async () => {
    throw new Error("Error invoking remote method 'youtube:status': Error: No handler registered for 'youtube:status'");
  });
  expect(result.status).toBe("unavailable"); expect(result.message).toContain("Ctrl+C"); expect(result.message).toContain("npm run dev again");
});
it("bounds stalled discovery even if the adapter ignores cancellation", async () => {
  vi.useFakeTimers();
  const pending = discoverLearningVideos(reportFixture().performance, request.signal, () => new Promise(() => {}));
  await vi.advanceTimersByTimeAsync(8001); expect((await pending).status).toBe("unavailable");
});

it("generates and atomically saves a report from real saved results", async () => {
  const report = await generateLearningReport(request);
  expect(report.adviceStatus).toBe("ready"); expect(report.performance.accuracy).toBe(50); expect(report.videoStatus).toBe("unavailable");
  expect(mocks.write).toHaveBeenCalledWith("forge-reports.json", expect.any(String), { atomic: true, expectedVaultPath: mocks.vault });
  const prompt = mocks.ask.mock.calls[0][1]; expect(prompt).not.toContain(mocks.vault); expect(prompt).not.toContain(REPORT_NOTE.path);
  expect(JSON.parse(prompt).evidence.examples[0]).toMatchObject({ selectedAnswer: "Wrong", correctAnswer: "Correct", correct: false });
});
it("saves a report with all five questions completed across three topics and forty percent accuracy", async () => {
  const third = reportQuiz("paging", "Paging", { q1: 0 });
  third.quiz.questions = third.quiz.questions.slice(0, 1);
  mocks.disk.set(`${mocks.vault}:comments.json`, JSON.stringify({ [REPORT_NOTE.path]: [
    reportQuiz("deadlocks", "Deadlocks", { q1: 1, q2: 1 }),
    reportQuiz("memory", "Memory", { q1: 0, q2: 1 }), third,
  ] }));
  mocks.ask.mockRejectedValue(new TypeError("Offline"));
  const report = await generateLearningReport(request);
  expect(report.performance).toMatchObject({ total: 5, answered: 5, correct: 2, incorrect: 3, unanswered: 0, accuracy: 40 });
  expect(report.performance.topics).toHaveLength(3);
  expect((await loadLearningReports(mocks.vault)).reports[0]).toEqual(report);
});
it.each(["missing-config", "network", "invalid-json", "invalid-schema", "unsupported-passage"])("saves usable deterministic fallback after %s", async kind => {
  if (kind === "missing-config") mocks.config.mockReturnValue(null);
  if (kind === "network") mocks.ask.mockRejectedValue(new TypeError("private stack"));
  if (kind === "invalid-json") mocks.ask.mockResolvedValue("not JSON");
  if (kind === "invalid-schema") mocks.ask.mockResolvedValue('{"madeUpScore":100}');
  if (kind === "unsupported-passage") { const advice = reportAdvice(); advice.focus[0].sourceExcerpt = "Fabricated evidence in no note."; mocks.ask.mockResolvedValue(JSON.stringify(advice)); }
  const report = await generateLearningReport(request);
  expect(report.advice).toBeNull(); expect(report.adviceStatus).toBe("unavailable"); expect(report.performance.accuracy).toBe(50);
  expect(report.adviceMessage).not.toContain("private stack"); expect((await loadLearningReports(mocks.vault)).reports).toHaveLength(1);
});
it("falls back after the AI time bound without blocking the report indefinitely", async () => {
  vi.useFakeTimers(); mocks.ask.mockImplementation(() => new Promise(() => {}));
  const pending = generateLearningReport(request);
  await vi.advanceTimersByTimeAsync(REPORT_ADVICE_TIMEOUT_MS + 1);
  expect((await pending).adviceStatus).toBe("unavailable");
});
it("keeps deterministic performance when note content is empty", async () => {
  request.readNote = async () => ({ content: "", revision: "" });
  expect((await generateLearningReport(request)).performance.answered).toBe(2); expect(mocks.ask).not.toHaveBeenCalled();
});
it("blocks generation without saved answers", async () => {
  mocks.disk.set(`${mocks.vault}:comments.json`, JSON.stringify({ [REPORT_NOTE.path]: [reportQuiz("empty", "Deadlocks", {})] }));
  await expect(generateLearningReport(request)).rejects.toThrow("Answer some quiz questions");
  expect(mocks.ask).not.toHaveBeenCalled(); expect(mocks.write).not.toHaveBeenCalled();
});
it.each(["note", "answers", "vault", "cancel", "missing-note"])("rejects stale generation when %s changes", async kind => {
  const controller = new AbortController(); request.signal = controller.signal;
  let reads = 0;
  if (kind === "note") request.readNote = async () => ({ content: ++reads > 1 ? "Changed source" : REPORT_PASSAGE, revision: REPORT_PASSAGE });
  if (kind === "missing-note") request.readNote = async () => { throw new Error("Missing"); };
  mocks.ask.mockImplementation(async () => {
    if (kind === "answers") await answerQuizQuestion(REPORT_NOTE.path, "deadlocks", "q2", 0);
    if (kind === "vault") { mocks.vault = "/other"; setCommentsVaultPath(mocks.vault); }
    if (kind === "cancel") controller.abort();
    return JSON.stringify(reportAdvice());
  });
  await expect(generateLearningReport(request)).rejects.toThrow(); expect(mocks.write).not.toHaveBeenCalled();
});
it("rejects an unavailable source context", async () => {
  request.isSourceAvailable = () => false; await expect(generateLearningReport(request)).rejects.toThrow("source note or vault changed");
});
it("does not claim success when report persistence fails", async () => {
  mocks.write.mockRejectedValue(new Error("Disk failure"));
  await expect(generateLearningReport(request)).rejects.toThrow("could not be saved");
  expect((await loadLearningReports(mocks.vault)).reports).toHaveLength(0);
});
it("explains that a stale Electron main process must restart instead of blaming completed quizzes", async () => {
  mocks.write.mockRejectedValue(new Error("Error invoking remote method 'data:write': Error: Invalid quiz comment write options"));
  await expect(generateLearningReport(request)).rejects.toThrow("Restart NetherWrite to enable report saving");
  expect((await loadLearningReports(mocks.vault)).reports).toHaveLength(0);
  expect((await loadComments(REPORT_NOTE.path))[0].quiz?.answers.q1).toBe(1);
});
it.each(["EACCES", "EPERM", "ENOSPC"])("shows safe actionable storage errors for %s", async code => {
  mocks.write.mockRejectedValue(new Error(`${code}: private-path-and-error-details`));
  try { await generateLearningReport(request); expect.fail("Expected save failure"); }
  catch (error) {
    const message = (error as Error).message;
    expect(message).toContain(code === "ENOSPC" ? "drive is full" : "folder permissions");
    expect(message).not.toContain("private-path");
  }
});
it("regenerates a new snapshot without altering old reports or quiz answer locking", async () => {
  const first = await generateLearningReport(request);
  await answerQuizQuestion(REPORT_NOTE.path, "deadlocks", "q1", 0); // First wrong answer stays locked.
  await answerQuizQuestion(REPORT_NOTE.path, "deadlocks", "q2", 0);
  const second = await generateLearningReport(request);
  expect(first.performance.accuracy).toBe(50); expect(second.performance.accuracy).toBe(67); expect(second.id).not.toBe(first.id);
  const saved = (await loadLearningReports(mocks.vault)).reports;
  expect(saved).toHaveLength(2); expect(saved.find(report => report.id === first.id)?.performance.accuracy).toBe(50);
});
it("reopens saved reports offline and deletes them without touching quiz files", async () => {
  const report = await generateLearningReport(request), commentsBefore = mocks.disk.get(`${mocks.vault}:comments.json`);
  mocks.ask.mockRejectedValue(new Error("Offline"));
  expect((await loadLearningReports(mocks.vault)).reports[0]).toEqual(report);
  await deleteLearningReport(mocks.vault, report.id);
  expect((await loadLearningReports(mocks.vault)).reports).toHaveLength(0);
  expect(mocks.disk.get(`${mocks.vault}:comments.json`)).toBe(commentsBefore);
  expect((await loadComments(REPORT_NOTE.path))[0].quiz?.answers.q1).toBe(1);
});
it("serializes concurrent saves and refuses duplicate report identities", async () => {
  await Promise.all([saveLearningReport(reportFixture("first"), mocks.vault), saveLearningReport(reportFixture("second"), mocks.vault)]);
  expect((await loadLearningReports(mocks.vault)).reports).toHaveLength(2);
  await expect(saveLearningReport(reportFixture("first"), mocks.vault)).rejects.toThrow("already exists");
});
it("preserves reports when source is deleted and updates exact rename references", async () => {
  await saveLearningReport(reportFixture(), mocks.vault);
  mocks.exists.mockResolvedValue(false); expect((await loadLearningReports(mocks.vault)).reports).toHaveLength(1);
  await renameReportSources(mocks.vault, REPORT_NOTE.path, "Moved/OS.md", false);
  const report = (await loadLearningReports(mocks.vault)).reports[0];
  expect(report.sourceNotePath).toBe("Moved/OS.md"); expect(report.performance.notePath).toBe("Moved/OS.md"); expect(report.performance.accuracy).toBe(50);
  expect(report.createdAt).toBe(1);
});
it("isolates reports and quiz caches by active vault", async () => {
  await saveLearningReport(reportFixture(), mocks.vault);
  mocks.vault = "/other-vault"; setCommentsVaultPath(mocks.vault);
  expect((await loadLearningReports(mocks.vault)).reports).toHaveLength(0);
  await expect(loadNoteQuizPerformance(request.vaultPath, REPORT_NOTE.path)).rejects.toThrow("vault changed");
  await expect(saveLearningReport(reportFixture(), request.vaultPath)).rejects.toThrow("vault is no longer open");
});
it("preserves malformed stored records while loading valid reports", async () => {
  const malformed = { id: "bad", type: "learning-report" };
  mocks.disk.set(`${mocks.vault}:forge-reports.json`, JSON.stringify({ version: 1, reports: [reportFixture(), malformed] }));
  expect(await loadLearningReports(mocks.vault)).toMatchObject({ reports: [reportFixture()], skipped: 1 });
  await saveLearningReport(reportFixture("new"), mocks.vault);
  expect(JSON.parse(mocks.disk.get(`${mocks.vault}:forge-reports.json`)!).reports).toContainEqual(malformed);
});
it.each(["{broken", '{"version":2,"reports":[]}'])("never overwrites unreadable or unsupported report storage %s", async raw => {
  mocks.disk.set(`${mocks.vault}:forge-reports.json`, raw);
  await expect(saveLearningReport(reportFixture(), mocks.vault)).rejects.toThrow(); expect(mocks.write).not.toHaveBeenCalled();
});
it("does not overwrite an existing file after a null read failure", async () => {
  mocks.exists.mockResolvedValue(true); await expect(saveLearningReport(reportFixture(), mocks.vault)).rejects.toThrow("preserved");
  expect(mocks.write).not.toHaveBeenCalled();
});
it("bounds note and performance evidence and explicitly marks partial coverage", () => {
  const prepared = prepareReportEvidence(reportFixture().performance, REPORT_PASSAGE.repeat(1000), false);
  expect(prepared.evidenceTruncated).toBe(true);
  expect(new TextEncoder().encode(JSON.stringify(prepared)).length + prepared.outputTokens + 1400).toBeLessThan(4096);
  expect(prepared.evidence.overall.accuracy).toBe(50);
});
