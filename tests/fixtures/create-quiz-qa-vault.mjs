// Manual QA utility only. Always creates a fresh scratch vault in the OS temp
// directory; never accepts a user vault path or changes an existing vault.
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const vault = await mkdtemp(path.join(tmpdir(), "netherwrite-quiz-qa-"));
// Comment identities use vault-relative paths, like the editor's activePath.
const notePath = "Quiz QA.md";
const content = `# Quiz comment QA

Process Scheduling assigns CPU time to runnable processes.

Deadlocks can occur when processes wait for resources held by each other.

Memory Management tracks and allocates available memory.

Ordinary comments continue to work alongside quiz comments.
`;
const questions = [
  { id: "condition", question: "Which is a necessary condition for deadlock?", options: ["Mutual exclusion", "Unlimited memory", "Only one process", "No shared resources"], correctIndex: 0, explanation: "Mutual exclusion means a resource can be held by only one process at a time." },
  { id: "waiting", question: "What does hold and wait describe?", options: ["Releasing every resource", "Holding one resource while waiting for another", "Never requesting a resource", "Running without memory"], correctIndex: 1, explanation: "A process retains a resource while requesting an additional resource." },
  { id: "cycle", question: "What is circular wait?", options: ["A CPU scheduling queue", "A disk directory", "A cycle of processes waiting for resources held by the next process", "A single process finishing"], correctIndex: 2, explanation: "The resource dependencies form a cycle of waiting processes." },
  { id: "preemption", question: "What does no preemption mean for a held resource?", options: ["It has no owner", "It is always shared", "It is automatically duplicated", "It cannot be forcibly taken away"], correctIndex: 3, explanation: "The process holding the resource must release it voluntarily." },
  { id: "prevention", question: "Which approach can prevent circular wait?", options: ["Acquire resources in a consistent global order", "Never finish a task", "Always hold more resources", "Remove every scheduler"], correctIndex: 0, explanation: "A consistent resource acquisition order prevents cycles of waiting dependencies." },
];
const topics = [
  { id: "single", topic: "Process Scheduling", count: 1 },
  { id: "five", topic: "Deadlocks", count: 5 },
  { id: "two", topic: "Memory Management", count: 2 },
];
const comments = topics.map(({ id, topic, count }) => ({
  id: `qa-${id}`, notePath,
  from: content.indexOf(topic), to: content.indexOf(topic) + topic.length,
  selectedText: topic, content: "", author: { name: "QA Fixture" }, createdAt: 1,
  type: "quiz", quiz: {
    topic,
    // Static fixtures exercise variable counts; this utility is not a generator.
    questions: id === "five" ? questions : Array.from({ length: count }, (_, index) => ({
      id: `qa-${id}-${index}`,
      question: index === 0 ? "Which term names this passage's topic?" : "Where is this topic described?",
      options: index === 0 ? [topic, "Unrelated topic", "No topic", "Unknown topic"] : ["In this anchored passage", "In an empty note", "In a remote dashboard", "Nowhere"],
      correctIndex: 0,
      explanation: "This is a static QA fixture anchored to the topic text in this note.",
    })),
    answers: {},
  },
}));
const ordinaryText = "Ordinary comments";
comments.push({
  id: "qa-ordinary", notePath,
  from: content.indexOf(ordinaryText), to: content.indexOf(ordinaryText) + ordinaryText.length,
  selectedText: ordinaryText, content: "Edit, reply to, and delete this ordinary fixture comment.",
  author: { name: "QA Fixture" }, createdAt: 1, replies: [],
});
await mkdir(path.join(vault, ".netherwrite"));
await writeFile(path.join(vault, notePath), content);
await writeFile(path.join(vault, "Second Note.md"), "# Second Note\n\nSwitch back to Quiz QA to check saved answers.\n");
await writeFile(path.join(vault, ".netherwrite", "comments.json"), JSON.stringify({ [notePath]: comments }, null, 2));
console.log(vault);
