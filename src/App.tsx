import { useMemo, useState } from "react";

type Question = {
  a: number;
  b: number;
  answer: number;
  key: string;
};

type Level = {
  id: number;
  name: string;
  tables: number[];
  color: string;
};

const PASS_SCORE = 8;
const QUESTIONS_PER_LEVEL = 10;
const MAX_HEARTS = 3;
const STORAGE_KEY = "duolijingo_progress_v41";

const levels: Level[] = [
  { id: 1, name: "Tabla del 1", tables: [1], color: "#22c55e" },
  { id: 2, name: "Tabla del 2", tables: [2], color: "#06b6d4" },
  { id: 3, name: "Mezcla 1 y 2", tables: [1, 2], color: "#3b82f6" },
  { id: 4, name: "Tabla del 3", tables: [3], color: "#8b5cf6" },
  { id: 5, name: "Mezcla 1, 2 y 3", tables: [1, 2, 3], color: "#d946ef" },
  { id: 6, name: "Tabla del 4", tables: [4], color: "#f97316" },
  { id: 7, name: "Mezcla 1 a 4", tables: [1, 2, 3, 4], color: "#ef4444" },
  { id: 8, name: "Tabla del 5", tables: [5], color: "#eab308" },
  { id: 9, name: "Mezcla 1 a 5", tables: [1, 2, 3, 4, 5], color: "#84cc16" },
  { id: 10, name: "Tabla del 6", tables: [6], color: "#14b8a6" },
  { id: 11, name: "Mezcla 1 a 6", tables: [1, 2, 3, 4, 5, 6], color: "#0ea5e9" },
  { id: 12, name: "Tabla del 7", tables: [7], color: "#6366f1" },
  { id: 13, name: "Mezcla 1 a 7", tables: [1, 2, 3, 4, 5, 6, 7], color: "#a855f7" },
  { id: 14, name: "Tabla del 8", tables: [8], color: "#ec4899" },
  { id: 15, name: "Mezcla 1 a 8", tables: [1, 2, 3, 4, 5, 6, 7, 8], color: "#f43f5e" },
  { id: 16, name: "Tabla del 9", tables: [9], color: "#f59e0b" },
  { id: 17, name: "Mezcla 1 a 9", tables: [1, 2, 3, 4, 5, 6, 7, 8, 9], color: "#10b981" },
  { id: 18, name: "Tabla del 10", tables: [10], color: "#64748b" },
  { id: 19, name: "Mezcla final", tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], color: "#0f766e" },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createQuestion(a: number, b: number): Question {
  return {
    a,
    b,
    answer: a * b,
    key: `${a}x${b}`,
  };
}

function generateRandomQuestion(
  tables: number[],
  recentKeys: string[] = []
): Question {
  const possibleQuestions: Question[] = [];

  for (const a of tables) {
    for (let b = 1; b <= 10; b++) {
      possibleQuestions.push(createQuestion(a, b));
    }
  }

  const filtered = possibleQuestions.filter(
    (q) => !recentKeys.includes(q.key)
  );

  const source = filtered.length > 0 ? filtered : possibleQuestions;
  return source[randomInt(0, source.length - 1)];
}

function getSavedProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      unlockedLevel: 1,
      stars: 0,
    };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      unlockedLevel: parsed.unlockedLevel ?? 1,
      stars: parsed.stars ?? 0,
    };
  } catch {
    return {
      unlockedLevel: 1,
      stars: 0,
    };
  }
}

function saveProgress(unlockedLevel: number, stars: number) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      unlockedLevel,
      stars,
    })
  );
}

export default function App() {
  const saved = getSavedProgress();

  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(saved.unlockedLevel);
  const [stars, setStars] = useState<number>(saved.stars);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [finished, setFinished] = useState(false);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | "">("");
  const [retryQueue, setRetryQueue] = useState<Question[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [recentQuestionKeys, setRecentQuestionKeys] = useState<string[]>([]);

  const levelData = useMemo(
    () => levels.find((l) => l.id === currentLevel) ?? levels[0],
    [currentLevel]
  );

  const [question, setQuestion] = useState<Question>(
    generateRandomQuestion(levels[0].tables, [])
  );

  const progressPercent = Math.round(
    (Math.min(questionNumber, QUESTIONS_PER_LEVEL) / QUESTIONS_PER_LEVEL) * 100
  );

  const globalProgressPercent = Math.round(
    ((unlockedLevel - 1) / levels.length) * 100
  );

  const startLevel = (levelId: number) => {
    if (levelId > unlockedLevel) return;

    const selected = levels.find((l) => l.id === levelId) ?? levels[0];

    setCurrentLevel(selected.id);
    setStarted(true);
    setFinished(false);
    setScore(0);
    setQuestionNumber(1);
    setUserAnswer("");
    setFeedback("");
    setHearts(MAX_HEARTS);
    setLastResult("");
    setRetryQueue([]);
    setWrongAnswers(0);
    setRecentQuestionKeys([]);
    setQuestion(generateRandomQuestion(selected.tables, []));
  };

  const getNextQuestion = (
    tables: number[],
    queue: Question[],
    recentKeys: string[]
  ) => {
    if (queue.length > 0) {
      const retryIndex = queue.findIndex(
        (item) => !recentKeys.includes(item.key)
      );

      if (retryIndex >= 0) {
        const selectedRetry = queue[retryIndex];
        const newQueue = queue.filter((_, index) => index !== retryIndex);
        setRetryQueue(newQueue);
        return selectedRetry;
      }

      const [nextRetry, ...rest] = queue;
      setRetryQueue(rest);
      return nextRetry;
    }

    return generateRandomQuestion(tables, recentKeys);
  };

  const submitAnswer = () => {
    const value = Number(userAnswer);

    if (userAnswer.trim() === "" || Number.isNaN(value)) {
      setFeedback("Escribe una respuesta.");
      return;
    }

    let newScore = score;
    let newHearts = hearts;
    let newWrongAnswers = wrongAnswers;
    let newRetryQueue = [...retryQueue];

    if (value === question.answer) {
      newScore += 1;
      setFeedback("✅ Correcto");
      setLastResult("correct");
    } else {
      newHearts -= 1;
      newWrongAnswers += 1;
      setFeedback(`❌ Incorrecto. Era ${question.answer}`);
      setLastResult("wrong");

      const alreadyQueued = newRetryQueue.some(
        (item) => item.key === question.key
      );

      if (!alreadyQueued) {
        newRetryQueue.push(question);
      }
    }

    setScore(newScore);
    setHearts(newHearts);
    setWrongAnswers(newWrongAnswers);
    setRetryQueue(newRetryQueue);

    const noMoreHearts = newHearts <= 0;
    const baseQuestionsDone = questionNumber >= QUESTIONS_PER_LEVEL;
    const retryPending = newRetryQueue.length > 0;

    if (noMoreHearts || (baseQuestionsDone && !retryPending)) {
      setFinished(true);

      let newUnlockedLevel = unlockedLevel;
      let newStars = stars;

      if (newScore >= PASS_SCORE && newHearts > 0) {
        newUnlockedLevel = Math.min(currentLevel + 1, levels.length);

        if (newUnlockedLevel > unlockedLevel) {
          setUnlockedLevel(newUnlockedLevel);
        }

        newStars += 1;
        setStars(newStars);
      }

      saveProgress(newUnlockedLevel, newStars);
      return;
    }

    setTimeout(() => {
      setQuestionNumber((prev) => (baseQuestionsDone ? prev : prev + 1));
      setUserAnswer("");
      setFeedback("");
      setLastResult("");

      const updatedRecentKeys = [...recentQuestionKeys, question.key].slice(-3);
      setRecentQuestionKeys(updatedRecentKeys);

      const nextQuestion = getNextQuestion(
        levelData.tables,
        newRetryQueue,
        updatedRecentKeys
      );

      setQuestion(nextQuestion);
    }, 700);
  };

  const passed = score >= PASS_SCORE && hearts > 0;

  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUnlockedLevel(1);
    setStars(0);
    setCurrentLevel(1);
    setStarted(false);
    setFinished(false);
    setScore(0);
    setQuestionNumber(1);
    setUserAnswer("");
    setFeedback("");
    setHearts(MAX_HEARTS);
    setLastResult("");
    setRetryQueue([]);
    setWrongAnswers(0);
    setRecentQuestionKeys([]);
    setQuestion(generateRandomQuestion(levels[0].tables, []));
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.10)",
  };

  const primaryButton: React.CSSProperties = {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "14px 20px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const greenButton: React.CSSProperties = {
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "14px 20px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const grayButton: React.CSSProperties = {
    background: "#e2e8f0",
    color: "#0f172a",
    border: "none",
    borderRadius: "16px",
    padding: "14px 20px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #ecfdf5 0%, #eff6ff 55%, #f8fafc 100%)",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            ...cardStyle,
            marginBottom: "24px",
            background: "linear-gradient(135deg, #16a34a 0%, #0ea5e9 100%)",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
                🦉 DuoliJingo Matemático
              </div>
              <h1 style={{ margin: 0, fontSize: "42px", lineHeight: 1.1 }}>
                Aprende tablas paso a paso
              </h1>
              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  fontSize: "18px",
                  opacity: 0.95,
                }}
              >
                Aprende una tabla, mézclala con otras y refuerza los errores antes de cerrar el nivel.
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                borderRadius: "22px",
                padding: "18px",
                minWidth: "260px",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                Progreso general: {globalProgressPercent}%
              </div>
              <div
                style={{
                  width: "100%",
                  height: "12px",
                  background: "rgba(255,255,255,0.25)",
                  borderRadius: "999px",
                  overflow: "hidden",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: `${globalProgressPercent}%`,
                    height: "100%",
                    background: "#ffffff",
                    borderRadius: "999px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", opacity: 0.85 }}>
                    Desbloqueado
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    Nivel {unlockedLevel}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "13px", opacity: 0.85 }}>
                    Estrellas
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    ⭐ {stars}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!started && (
          <>
            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{
                      marginTop: 0,
                      marginBottom: "8px",
                      fontSize: "30px",
                    }}
                  >
                    Mapa de niveles
                  </h2>
                  <p style={{ margin: 0, color: "#475569", fontSize: "17px" }}>
                    Necesita al menos <strong>{PASS_SCORE}/10</strong>, no quedarse sin corazones y corregir errores frecuentes.
                  </p>
                </div>

                <button
                  onClick={resetProgress}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Reiniciar progreso
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {levels.map((level) => {
                const locked = level.id > unlockedLevel;
                const completed = level.id < unlockedLevel;

                return (
                  <button
                    key={level.id}
                    onClick={() => startLevel(level.id)}
                    disabled={locked}
                    style={{
                      textAlign: "left",
                      border: "none",
                      borderRadius: "24px",
                      padding: "0",
                      cursor: locked ? "not-allowed" : "pointer",
                      background: "transparent",
                      opacity: locked ? 0.7 : 1,
                    }}
                  >
                    <div
                      style={{
                        ...cardStyle,
                        padding: 0,
                        overflow: "hidden",
                        border: completed
                          ? "2px solid #16a34a"
                          : "2px solid transparent",
                      }}
                    >
                      <div
                        style={{
                          height: "10px",
                          background: level.color,
                        }}
                      />
                      <div style={{ padding: "20px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              background: "#f1f5f9",
                              color: "#334155",
                              borderRadius: "999px",
                              padding: "6px 12px",
                              fontSize: "13px",
                              fontWeight: "bold",
                            }}
                          >
                            Nivel {level.id}
                          </div>

                          <div style={{ fontSize: "20px" }}>
                            {locked ? "🔒" : completed ? "✅" : "⭐"}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: "bold",
                            color: "#0f172a",
                          }}
                        >
                          {level.name}
                        </div>

                        <div
                          style={{
                            marginTop: "10px",
                            color: "#64748b",
                            fontSize: "15px",
                          }}
                        >
                          {locked
                            ? "Bloqueado hasta superar el nivel anterior."
                            : completed
                            ? "Ya superado. Puedes repetirlo."
                            : "Disponible para jugar."}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {started && !finished && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "20px",
            }}
          >
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-block",
                      background: levelData.color,
                      color: "white",
                      borderRadius: "999px",
                      padding: "8px 14px",
                      fontWeight: "bold",
                      marginBottom: "10px",
                    }}
                  >
                    {levelData.name}
                  </div>
                  <h2 style={{ margin: 0, fontSize: "30px" }}>
                    Pregunta {Math.min(questionNumber, QUESTIONS_PER_LEVEL)} de{" "}
                    {QUESTIONS_PER_LEVEL}
                  </h2>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      background: "#fef2f2",
                      borderRadius: "999px",
                      padding: "10px 16px",
                      fontWeight: "bold",
                      fontSize: "18px",
                    }}
                  >
                    {"❤️".repeat(hearts)}
                    {"🖤".repeat(MAX_HEARTS - hearts)}
                  </div>

                  <div
                    style={{
                      background: "#eff6ff",
                      borderRadius: "999px",
                      padding: "10px 16px",
                      fontWeight: "bold",
                      fontSize: "18px",
                    }}
                  >
                    Puntaje: {score}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "14px",
                    background: "#e2e8f0",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      background: levelData.color,
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "12px",
                  color: "#475569",
                  fontSize: "16px",
                }}
              >
                <div>
                  Errores del nivel: <strong>{wrongAnswers}</strong>
                </div>
                <div>
                  Repasos pendientes: <strong>{retryQueue.length}</strong>
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  fontSize: "72px",
                  fontWeight: "bold",
                  color: "#0f172a",
                  margin: "40px 0 30px",
                }}
              >
                {question.a} × {question.b}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitAnswer();
                  }}
                  style={{
                    padding: "16px",
                    fontSize: "28px",
                    borderRadius: "18px",
                    border: "2px solid #cbd5e1",
                    width: "220px",
                    textAlign: "center",
                    outline: "none",
                  }}
                  placeholder="?"
                />

                <button onClick={submitAnswer} style={primaryButton}>
                  Responder
                </button>

                <button onClick={() => setStarted(false)} style={grayButton}>
                  Salir
                </button>
              </div>

              <div
                style={{
                  minHeight: "60px",
                  marginTop: "26px",
                  textAlign: "center",
                  fontSize: "22px",
                  fontWeight: "bold",
                  color:
                    lastResult === "correct"
                      ? "#15803d"
                      : lastResult === "wrong"
                      ? "#dc2626"
                      : "#334155",
                }}
              >
                {feedback}
              </div>
            </div>
          </div>
        )}

        {finished && (
          <div style={cardStyle}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "72px", marginBottom: "10px" }}>
                {passed ? "🏆" : "📚"}
              </div>

              <h2
                style={{
                  marginTop: 0,
                  fontSize: "42px",
                  color: passed ? "#15803d" : "#b45309",
                }}
              >
                {passed ? "Nivel superado" : "Todavía no"}
              </h2>

              <p style={{ fontSize: "22px", color: "#334155" }}>
                Puntaje final: <strong>{score}/{QUESTIONS_PER_LEVEL}</strong>
              </p>

              <p
                style={{
                  fontSize: "18px",
                  color: "#64748b",
                  maxWidth: "700px",
                  margin: "0 auto 24px",
                }}
              >
                {passed
                  ? "Sí puede avanzar. Además, las preguntas falladas fueron reforzadas antes de cerrar el nivel."
                  : hearts <= 0
                  ? "Se quedó sin corazones. Conviene repetir y reforzar esta tabla antes de seguir."
                  : "No alcanzó el puntaje mínimo. Repetir aquí es mejor que avanzar con huecos."}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    background: "#eff6ff",
                    borderRadius: "22px",
                    padding: "18px",
                  }}
                >
                  <div style={{ color: "#64748b", marginBottom: "8px" }}>
                    Resultado
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: "bold" }}>
                    {score}/10
                  </div>
                </div>

                <div
                  style={{
                    background: "#fefce8",
                    borderRadius: "22px",
                    padding: "18px",
                  }}
                >
                  <div style={{ color: "#64748b", marginBottom: "8px" }}>
                    Corazones
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: "bold" }}>
                    {hearts}
                  </div>
                </div>

                <div
                  style={{
                    background: "#ecfdf5",
                    borderRadius: "22px",
                    padding: "18px",
                  }}
                >
                  <div style={{ color: "#64748b", marginBottom: "8px" }}>
                    Estrellas
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: "bold" }}>
                    ⭐ {stars}
                  </div>
                </div>

                <div
                  style={{
                    background: "#fdf2f8",
                    borderRadius: "22px",
                    padding: "18px",
                  }}
                >
                  <div style={{ color: "#64748b", marginBottom: "8px" }}>
                    Errores
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: "bold" }}>
                    {wrongAnswers}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button onClick={() => startLevel(currentLevel)} style={greenButton}>
                  Repetir nivel
                </button>

                {passed && currentLevel < levels.length && (
                  <button
                    onClick={() => startLevel(currentLevel + 1)}
                    style={primaryButton}
                  >
                    Siguiente nivel
                  </button>
                )}

                <button onClick={() => setStarted(false)} style={grayButton}>
                  Volver al mapa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}