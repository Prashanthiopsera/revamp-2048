/**
 * ScoreBoard — displays the current game score and all-time best score.
 *
 * ## Score addition animation
 * When the score increases, a "+N" element is rendered and fades upward via
 * a CSS animation (class `score-addition`). It mirrors the legacy actuator's
 * score-addition div. A unique key forces React to remount the element on
 * every increase, re-triggering the CSS animation.
 *
 * ## ARIA live regions
 * Each score container is an `aria-live="polite"` region so screen readers
 * announce score changes after the current interaction completes.
 */
import { useEffect, useRef, useState } from "react";
import { strings } from "../strings.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScoreBoardProps {
  /** Current session score. */
  readonly score: number;
  /** All-time best score. */
  readonly bestScore: number;
}

// ---------------------------------------------------------------------------
// Score delta animation hook
// ---------------------------------------------------------------------------

interface ScoreDelta {
  readonly delta: number;
  /** Unique id per increase so React remounts the animation element. */
  readonly key: number;
}

/**
 * Tracks score increases and produces a (delta, key) pair that drives the
 * +N animation element. Returns null when the score has not increased since
 * the last render.
 */
function useScoreDelta(score: number): ScoreDelta | null {
  const prevScoreRef = useRef(score);
  const [delta, setDelta] = useState<ScoreDelta | null>(null);
  const keyRef = useRef(0);

  useEffect(() => {
    const diff = score - prevScoreRef.current;
    if (diff > 0) {
      keyRef.current += 1;
      setDelta({ delta: diff, key: keyRef.current });
    }
    prevScoreRef.current = score;
  }, [score]);

  return delta;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScoreBoard({ score, bestScore }: ScoreBoardProps): React.ReactElement {
  const scoreDelta = useScoreDelta(score);

  return (
    <div className="scores-container">
      {/* Current score */}
      <div
        className="score-container"
        aria-live="polite"
        aria-atomic="true"
        aria-label={strings.SCORE_ANNOUNCEMENT.replace("{score}", String(score))}
      >
        <div className="score-label">{strings.SCORE_LABEL}</div>
        <div className="score-value">{score}</div>
        {scoreDelta !== null && (
          // key forces remount → CSS animation re-triggers on every score increase
          <div key={scoreDelta.key} className="score-addition">
            {`+${String(scoreDelta.delta)}`}
          </div>
        )}
      </div>

      {/* Best score */}
      <div
        className="best-container"
        aria-live="polite"
        aria-atomic="true"
        aria-label={strings.BEST_ANNOUNCEMENT.replace("{score}", String(bestScore))}
      >
        <div className="best-label">{strings.BEST_LABEL}</div>
        <div className="best-value">{bestScore}</div>
      </div>
    </div>
  );
}
