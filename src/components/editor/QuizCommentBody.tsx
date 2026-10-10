import { useId, useState } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { QuizData } from "../../types/comments";

interface QuizCommentBodyProps {
  quiz: QuizData;
  onAnswer?: (questionId: string, index: number) => Promise<void>;
}

const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)";

export function QuizCommentBody({ quiz, onAnswer }: QuizCommentBodyProps) {
  const [page, setPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionLabelId = useId();
  const questionIndex = Math.min(page, quiz.questions.length - 1);
  const question = quiz.questions[questionIndex];
  const selected = Object.prototype.hasOwnProperty.call(quiz.answers, question.id) ? quiz.answers[question.id] : undefined;
  const answered = selected !== undefined;
  const correct = selected === question.correctIndex;

  async function selectAnswer(index: number) {
    if (answered || isSaving || !onAnswer) return;
    setIsSaving(true);
    setError(null);
    try {
      await onAnswer(question.id, index);
    } catch {
      setError("Could not save your answer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-2 min-w-0" onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>
      <p id={questionLabelId} className="m-0 min-h-10 break-words text-[13px] font-medium leading-relaxed text-(--text-primary)">
        Q. {question.question}
      </p>
      <div role="group" aria-labelledby={questionLabelId} aria-busy={isSaving} className="mt-2 grid grid-cols-2 gap-2">
        {question.options.map((option, index) => {
          const isCorrect = answered && index === question.correctIndex;
          const isWrong = answered && index === selected && !correct;
          return (
            <button
              key={index}
              type="button"
              aria-pressed={index === selected}
              aria-disabled={answered || isSaving || !onAnswer}
              onClick={() => void selectAnswer(index)}
              className={`flex min-h-12 min-w-0 items-start gap-2 rounded-md border p-2 text-left text-xs leading-relaxed transition-colors duration-150 ${focusClass} ${
                isCorrect
                  ? "border-(--color-green) bg-[color-mix(in_srgb,var(--color-green)_12%,var(--bg-primary))]"
                  : isWrong
                    ? "border-(--color-red) bg-[color-mix(in_srgb,var(--color-red)_12%,var(--bg-primary))]"
                    : `border-(--border-medium) bg-(--bg-primary) ${answered ? "" : "hover:bg-(--bg-hover)"}`
              } text-(--text-primary)`}
            >
              <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${isCorrect ? "border-(--color-green) text-(--color-green)" : isWrong ? "border-(--color-red) text-(--color-red)" : "border-(--text-muted)"}`}>
                {isCorrect ? <Check size={12} /> : isWrong ? <X size={12} /> : null}
              </span>
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{option}</span>
              {isCorrect && <span className="sr-only">Correct answer</span>}
              {isWrong && <span className="sr-only">Incorrect answer</span>}
            </button>
          );
        })}
      </div>
      <div className="min-h-16 py-3 text-xs leading-relaxed" role="status" aria-live="polite">
        {answered && (
          <>
            <p className={`m-0 font-medium ${correct ? "text-(--color-green)" : "text-(--color-red)"}`}>{correct ? "Correct!" : "Not quite"}</p>
            {question.explanation && <p className="mb-0 mt-1 break-words text-(--text-secondary)">{question.explanation}</p>}
          </>
        )}
        {error && <p className="m-0 text-(--text-error)">{error}</p>}
      </div>
      <footer className="flex items-center justify-between border-t border-(--border-subtle) pt-2 text-xs text-(--text-muted)">
        <button type="button" aria-label="Previous question" disabled={questionIndex === 0 || isSaving} onClick={() => { setPage(questionIndex - 1); setError(null); }} className={`flex h-7 w-7 items-center justify-center rounded hover:bg-(--bg-hover) disabled:opacity-40 ${focusClass}`}>
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span aria-label="Question pagination">{questionIndex + 1} / {quiz.questions.length}</span>
        <button type="button" aria-label="Next question" disabled={questionIndex === quiz.questions.length - 1 || isSaving} onClick={() => { setPage(questionIndex + 1); setError(null); }} className={`flex h-7 w-7 items-center justify-center rounded hover:bg-(--bg-hover) disabled:opacity-40 ${focusClass}`}>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
}
