import { useMemo, useState } from "react";

type Mode = "multiplication" | "division" | "fractions";
type FractionVisualKind = "bar" | "circle" | "square";

type BaseQuestion = {
  key: string;
};

type ArithmeticQuestion = BaseQuestion & {
  type: "arithmetic";
  promptA: number;
  promptB: number;
  answer: number;
};

type FractionRecognitionQuestion = BaseQuestion & {
  type: "fraction_recognition";
  numerator: number;
  denominator: number;
  answer: string;
  options: string[];
  visualKind: FractionVisualKind;
};

type FractionCompareQuestion = BaseQuestion & {
  type: "fraction_compare";
  leftNumerator: number;
  leftDenominator: number;
  leftVisualKind: FractionVisualKind;
  rightNumerator: number;
  rightDenominator: number;
  rightVisualKind: FractionVisualKind;
  answer: "left" | "right";
};

type Question =
  | ArithmeticQuestion
  | FractionRecognitionQuestion
  | FractionCompareQuestion;

type Level = {
  id: number;
  name: string;
  values: number[];
  color: string;
};

const MAX_HEARTS = 3;
const STORAGE_KEY = "duolijingo_progress_v14";

const multiplicationLevels: Level[] = [
  { id: 1, name: "Tabla del 1", values: [1], color: "#22c55e" },
  { id: 2, name: "Tabla del 2", values: [2], color: "#06b6d4" },
  { id: 3, name: "Mezcla 1 y 2", values: [1, 2], color: "#3b82f6" },
  { id: 4, name: "Tabla del 3", values: [3], color: "#8b5cf6" },
  { id: 5, name: "Mezcla 1, 2 y 3", values: [1, 2, 3], color: "#d946ef" },
  { id: 6, name: "Tabla del 4", values: [4], color: "#f97316" },
  { id: 7, name: "Mezcla 1 a 4", values: [1, 2, 3, 4], color: "#ef4444" },
  { id: 8, name: "Tabla del 5", values: [5], color: "#eab308" },
  { id: 9, name: "Mezcla 1 a 5", values: [1, 2, 3, 4, 5], color: "#84cc16" },
  { id: 10, name: "Tabla del 6", values: [6], color: "#14b8a6" },
  { id: 11, name: "Mezcla 1 a 6", values: [1, 2, 3, 4, 5, 6], color: "#0ea5e9" },
  { id: 12, name: "Tabla del 7", values: [7], color: "#6366f1" },
  { id: 13, name: "Mezcla 1 a 7", values: [1, 2, 3, 4, 5, 6, 7], color: "#a855f7" },
  { id: 14, name: "Tabla del 8", values: [8], color: "#ec4899" },
  { id: 15, name: "Mezcla 1 a 8", values: [1, 2, 3, 4, 5, 6, 7, 8], color: "#f43f5e" },
  { id: 16, name: "Tabla del 9", values: [9], color: "#f59e0b" },
  { id: 17, name: "Mezcla 1 a 9", values: [1, 2, 3, 4, 5, 6, 7, 8, 9], color: "#10b981" },
  { id: 18, name: "Tabla del 10", values: [10], color: "#64748b" },
  { id: 19, name: "Mezcla final", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], color: "#0f766e" },
];

const divisionLevels: Level[] = [
  { id: 1, name: "Dividir entre 1", values: [1], color: "#22c55e" },
  { id: 2, name: "Dividir entre 2", values: [2], color: "#06b6d4" },
  { id: 3, name: "Mezcla 1 y 2", values: [1, 2], color: "#3b82f6" },
  { id: 4, name: "Dividir entre 3", values: [3], color: "#8b5cf6" },
  { id: 5, name: "Mezcla 1, 2 y 3", values: [1, 2, 3], color: "#d946ef" },
  { id: 6, name: "Dividir entre 4", values: [4], color: "#f97316" },
  { id: 7, name: "Mezcla 1 a 4", values: [1, 2, 3, 4], color: "#ef4444" },
  { id: 8, name: "Dividir entre 5", values: [5], color: "#eab308" },
  { id: 9, name: "Mezcla 1 a 5", values: [1, 2, 3, 4, 5], color: "#84cc16" },
  { id: 10, name: "Dividir entre 6", values: [6], color: "#14b8a6" },
];

const fractionLevels: Level[] = [
  { id: 1, name: "Mitades", values: [2], color: "#22c55e" },
  { id: 2, name: "Tercios", values: [3], color: "#06b6d4" },
  { id: 3, name: "Cuartos", values: [4], color: "#8b5cf6" },
  { id: 4, name: "Quintos", values: [5], color: "#f97316" },
  { id: 5, name: "Mezcla visual", values: [2, 3, 4, 5], color: "#ef4444" },
  { id: 6, name: "Comparar fracciones", values: [2, 3, 4, 5], color: "#0ea5e9" },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getAllLevels(mode: Mode) {
  if (mode === "multiplication") return multiplicationLevels;
  if (mode === "division") return divisionLevels;
  return fractionLevels;
}

function getStorageKey(mode: Mode) {
  return `${STORAGE_KEY}_${mode}`;
}

function getSavedProgress(mode: Mode) {
  const saved = localStorage.getItem(getStorageKey(mode));
  if (!saved) return { unlockedLevel: 1, stars: 0 };

  try {
    const parsed = JSON.parse(saved);
    return {
      unlockedLevel: parsed.unlockedLevel ?? 1,
      stars: parsed.stars ?? 0,
    };
  } catch {
    return { unlockedLevel: 1, stars: 0 };
  }
}

function saveProgress(mode: Mode, unlockedLevel: number, stars: number) {
  localStorage.setItem(
    getStorageKey(mode),
    JSON.stringify({ unlockedLevel, stars })
  );
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }

  return x;
}

function normalizeFraction(numerator: number, denominator: number) {
  const d = gcd(numerator, denominator);
  return `${numerator / d}/${denominator / d}`;
}

function parseFraction(value: string) {
  const [n, d] = value.split("/").map(Number);
  return { numerator: n, denominator: d };
}

function fractionValue(numerator: number, denominator: number) {
  return numerator / denominator;
}

function getQuestionsPerLevel(mode: Mode, levelId: number) {
  if (mode !== "fractions") return 10;
  if (levelId === 1) return 3;
  if (levelId === 2) return 4;
  if (levelId === 3) return 4;
  if (levelId === 4) return 5;
  if (levelId === 5) return 8;
  return 8;
}

function getPassScore(mode: Mode, levelId: number, totalQuestions: number) {
  if (mode !== "fractions") return 8;
  if (levelId === 1) return 3;
  if (levelId === 2) return 3;
  if (levelId === 3) return 3;
  if (levelId === 4) return 4;
  if (levelId === 5) return 6;
  return 6;
}

function getFractionVisualKinds(denominator: number): FractionVisualKind[] {
  if (denominator === 2) return ["bar", "circle", "square"];
  if (denominator === 3) return ["bar", "circle", "square"];
  if (denominator === 4) return ["bar", "circle", "square"];
  return ["bar"];
}

function createMultiplicationQuestion(a: number, b: number): ArithmeticQuestion {
  return {
    type: "arithmetic",
    promptA: a,
    promptB: b,
    answer: a * b,
    key: `m-${a}x${b}`,
  };
}

function createDivisionQuestion(divisor: number, result: number): ArithmeticQuestion {
  const dividend = divisor * result;
  return {
    type: "arithmetic",
    promptA: dividend,
    promptB: divisor,
    answer: result,
    key: `d-${dividend}/${divisor}`,
  };
}

function createFractionRecognitionQuestion(
  numerator: number,
  denominator: number,
  visualKind: FractionVisualKind
): FractionRecognitionQuestion {
  const answer = `${numerator}/${denominator}`;
  const answerNormalized = normalizeFraction(numerator, denominator);

  const globalFractionPool = [
    "1/2",
    "1/3",
    "2/3",
    "1/4",
    "2/4",
    "3/4",
    "1/5",
    "2/5",
    "3/5",
    "4/5",
  ];

  const wrongOptions = shuffleArray(
    globalFractionPool.filter((option) => {
      const parsed = parseFraction(option);
      return normalizeFraction(parsed.numerator, parsed.denominator) !== answerNormalized;
    })
  ).slice(0, 2);

  const options = shuffleArray([answer, ...wrongOptions]);

  return {
    type: "fraction_recognition",
    numerator,
    denominator,
    answer,
    options,
    visualKind,
    key: `fr-${numerator}/${denominator}-${visualKind}`,
  };
}

function createFractionCompareQuestion(values: number[]): FractionCompareQuestion {
  const pool: Array<{ n: number; d: number }> = [];

  for (const d of values) {
    for (let n = 1; n < d; n++) {
      pool.push({ n, d });
    }
  }

  let left = pool[randomInt(0, pool.length - 1)];
  let right = pool[randomInt(0, pool.length - 1)];

  let attempts = 0;
  while (
    (normalizeFraction(left.n, left.d) === normalizeFraction(right.n, right.d) ||
      fractionValue(left.n, left.d) === fractionValue(right.n, right.d)) &&
    attempts < 50
  ) {
    right = pool[randomInt(0, pool.length - 1)];
    attempts++;
  }

  const answer =
    fractionValue(left.n, left.d) > fractionValue(right.n, right.d) ? "left" : "right";

  const leftKinds = getFractionVisualKinds(left.d);
  const rightKinds = getFractionVisualKinds(right.d);

  return {
    type: "fraction_compare",
    leftNumerator: left.n,
    leftDenominator: left.d,
    leftVisualKind: leftKinds[randomInt(0, leftKinds.length - 1)],
    rightNumerator: right.n,
    rightDenominator: right.d,
    rightVisualKind: rightKinds[randomInt(0, rightKinds.length - 1)],
    answer,
    key: `fc-${left.n}/${left.d}-${right.n}/${right.d}-${answer}`,
  };
}

function generateQuestionForMode(
  mode: Mode,
  values: number[],
  recentKeys: string[] = [],
  levelId = 1
): Question {
  const possibleQuestions: Question[] = [];

  if (mode === "multiplication") {
    for (const a of values) {
      for (let b = 1; b <= 10; b++) {
        possibleQuestions.push(createMultiplicationQuestion(a, b));
      }
    }
  } else if (mode === "division") {
    for (const divisor of values) {
      for (let result = 1; result <= 10; result++) {
        possibleQuestions.push(createDivisionQuestion(divisor, result));
      }
    }
  } else {
    if (levelId === 6) {
      for (let i = 0; i < 30; i++) {
        possibleQuestions.push(createFractionCompareQuestion(values));
      }
    } else {
      for (const denominator of values) {
        for (let numerator = 1; numerator < denominator; numerator++) {
          const kinds = getFractionVisualKinds(denominator);
          for (const kind of kinds) {
            possibleQuestions.push(
              createFractionRecognitionQuestion(numerator, denominator, kind)
            );
          }
        }
      }
    }
  }

  const filtered = possibleQuestions.filter((q) => !recentKeys.includes(q.key));
  const source = filtered.length > 0 ? filtered : possibleQuestions;
  return source[randomInt(0, source.length - 1)];
}

function getLessonText(mode: Mode, level: Level) {
  if (mode === "multiplication") {
    const n = level.values[0] ?? 2;

    return {
      title: "Multiplicar es sumar varias veces",
      text: `Multiplicar es sumar el mismo número varias veces.\n\nSi tienes ${n} grupos de 3, estás sumando 3 + 3 + 3...`,
      example: `${n} × 3 = ${n * 3}`,
    };
  }

  if (mode === "division") {
    const divisor = level.values[0] ?? 2;
    const dividend = divisor * 4;

    return {
      title: "Dividir es repartir",
      text: `Dividir es repartir en partes iguales.\n\nSi tienes ${dividend} cosas y las repartes en grupos de ${divisor}, obtienes grupos iguales.`,
      example: `${dividend} ÷ ${divisor} = 4`,
    };
  }

  if (level.id === 1) {
    return {
      title: "¿Qué es un medio?",
      text: `Imagina una pizza partida en 2 partes iguales.\n\nSi tomas 1 parte, tienes un medio.`,
      example: "1/2 = 1 de 2 partes iguales",
    };
  }

  if (level.id === 2) {
    return {
      title: "¿Qué es un tercio?",
      text: `Si divides algo en 3 partes iguales y tomas 1 parte,\n\neso es un tercio.`,
      example: "1/3 = 1 de 3 partes iguales",
    };
  }

  if (level.id === 3) {
    return {
      title: "¿Qué es un cuarto?",
      text: `Si divides un entero en 4 partes iguales y tomas una,\n\neso es un cuarto.`,
      example: "1/4 = 1 de 4 partes iguales",
    };
  }

  if (level.id === 4) {
    return {
      title: "Partes de un entero",
      text: `Una fracción muestra partes de un todo.\n\nMientras más partes tenga, más pequeñas son.`,
      example: "1/5 = 1 de 5 partes iguales",
    };
  }

  if (level.id === 5) {
    return {
      title: "Reconocer fracciones",
      text: `Observa bien cuántas partes tiene la figura.\n\nDespués cuenta cuántas están pintadas.`,
      example: "Numerador = partes pintadas",
    };
  }

  return {
    title: "¿Cuál es mayor?",
    text: `Mira cuál figura tiene una parte más grande o más área pintada.\n\nEsa representa la fracción mayor.`,
    example: "1/2 es mayor que 1/3",
  };
}

function getPedagogicalFeedback(question: Question, wasCorrect: boolean) {
  if (question.type === "arithmetic") {
    const isDivision = question.key.startsWith("d-");

    if (isDivision) {
      if (wasCorrect) {
        return `✅ Correcto\n${question.promptA} ÷ ${question.promptB} = ${question.answer} porque ${question.promptA} repartido en ${question.promptB} grupos iguales da ${question.answer} en cada grupo.`;
      }

      return `❌ Incorrecto. Era ${question.answer}\n${question.promptA} ÷ ${question.promptB} = ${question.answer} porque al repartir ${question.promptA} en ${question.promptB} grupos iguales, quedan ${question.answer} en cada grupo.`;
    }

    if (wasCorrect) {
      return `✅ Correcto\n${question.promptA} × ${question.promptB} = ${question.answer} porque son ${question.promptA} grupos de ${question.promptB}.`;
    }

    return `❌ Incorrecto. Era ${question.answer}\n${question.promptA} × ${question.promptB} = ${question.answer} porque son ${question.promptA} grupos de ${question.promptB}.`;
  }

  if (question.type === "fraction_recognition") {
    if (wasCorrect) {
      return `✅ Correcto\n${question.answer} significa ${question.numerator} parte${question.numerator > 1 ? "s" : ""} pintada${question.numerator > 1 ? "s" : ""} de ${question.denominator} partes iguales.`;
    }

    return `❌ Incorrecto. Era ${question.answer}\n${question.answer} significa ${question.numerator} parte${question.numerator > 1 ? "s" : ""} pintada${question.numerator > 1 ? "s" : ""} de ${question.denominator} partes iguales.`;
  }

  const leftValue = fractionValue(question.leftNumerator, question.leftDenominator);
  const rightValue = fractionValue(question.rightNumerator, question.rightDenominator);
  const winnerText = question.answer === "left" ? "la izquierda" : "la derecha";
  const winnerFraction =
    question.answer === "left"
      ? `${question.leftNumerator}/${question.leftDenominator}`
      : `${question.rightNumerator}/${question.rightDenominator}`;

  const loserFraction =
    question.answer === "left"
      ? `${question.rightNumerator}/${question.rightDenominator}`
      : `${question.leftNumerator}/${question.leftDenominator}`;

  if (wasCorrect) {
    return `✅ Correcto\nLa mayor es ${winnerFraction} (${winnerText}) porque representa una porción más grande que ${loserFraction}.`;
  }

  if (leftValue === rightValue) {
    return `❌ Incorrecto\nEstas fracciones valen lo mismo.`;
  }

  return `❌ Incorrecto. La mayor era ${winnerText}\n${winnerFraction} es mayor que ${loserFraction} porque representa una porción más grande del entero.`;
}

function FractionBar({
  numerator,
  denominator,
}: {
  numerator: number;
  denominator: number;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))`,
          width: "min(720px, 90%)",
          height: "90px",
          border: "5px solid #1e293b",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        {Array.from({ length: denominator }).map((_, i) => {
          const filled = i < numerator;
          const isLast = i === denominator - 1;

          return (
            <div
              key={i}
              style={{
                background: filled ? "#22c55e" : "#ffffff",
                borderRight: isLast ? "none" : "5px solid #1e293b",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeSector(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function FractionCircle({
  numerator,
  denominator,
}: {
  numerator: number;
  denominator: number;
}) {
  const size = 240;
  const cx = 120;
  const cy = 120;
  const r = 105;

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: denominator }).map((_, i) => {
          const startAngle = (i * 360) / denominator;
          const endAngle = ((i + 1) * 360) / denominator;
          const filled = i < numerator;

          return (
            <path
              key={i}
              d={describeSector(cx, cy, r, startAngle, endAngle)}
              fill={filled ? "#22c55e" : "#ffffff"}
              stroke="#1e293b"
              strokeWidth="5"
            />
          );
        })}
      </svg>
    </div>
  );
}

function FractionSquare({
  numerator,
  denominator,
}: {
  numerator: number;
  denominator: number;
}) {
  if (denominator === 2 || denominator === 3) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${denominator}, 1fr)`,
            width: "220px",
            height: "220px",
            border: "5px solid #1e293b",
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: denominator }).map((_, i) => (
            <div
              key={i}
              style={{
                background: i < numerator ? "#22c55e" : "#ffffff",
                borderRight: i === denominator - 1 ? "none" : "5px solid #1e293b",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
          width: "220px",
          height: "220px",
          border: "5px solid #1e293b",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: i < numerator ? "#22c55e" : "#ffffff",
              borderRight: i % 2 === 1 ? "none" : "5px solid #1e293b",
              borderBottom: i >= 2 ? "none" : "5px solid #1e293b",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FractionVisual({
  numerator,
  denominator,
  visualKind,
}: {
  numerator: number;
  denominator: number;
  visualKind: FractionVisualKind;
}) {
  if (visualKind === "circle") {
    return <FractionCircle numerator={numerator} denominator={denominator} />;
  }

  if (visualKind === "square") {
    return <FractionSquare numerator={numerator} denominator={denominator} />;
  }

  return <FractionBar numerator={numerator} denominator={denominator} />;
}

export default function App() {
  const [mode, setMode] = useState<Mode>("multiplication");
  const saved = getSavedProgress(mode);
  const levels = getAllLevels(mode);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(saved.unlockedLevel);
  const [stars, setStars] = useState<number>(saved.stars);
  const [screen, setScreen] = useState<"map" | "lesson" | "play" | "result">("map");

  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | "">("");
  const [retryQueue, setRetryQueue] = useState<Question[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [recentQuestionKeys, setRecentQuestionKeys] = useState<string[]>([]);

  const levelData = useMemo(
    () => levels.find((l) => l.id === currentLevel) ?? levels[0],
    [currentLevel, levels]
  );

  const totalQuestions = getQuestionsPerLevel(mode, currentLevel);
  const passScore = getPassScore(mode, currentLevel, totalQuestions);

  const [question, setQuestion] = useState<Question>(
    generateQuestionForMode(mode, levels[0].values, [], 1)
  );

  const progressPercent = Math.round(
    (Math.min(questionNumber, totalQuestions) / totalQuestions) * 100
  );

  const globalProgressPercent = Math.round(
    ((unlockedLevel - 1) / levels.length) * 100
  );

  function switchMode(newMode: Mode) {
    const newSaved = getSavedProgress(newMode);
    const newLevels = getAllLevels(newMode);

    setMode(newMode);
    setCurrentLevel(1);
    setUnlockedLevel(newSaved.unlockedLevel);
    setStars(newSaved.stars);
    setScreen("map");
    setScore(0);
    setQuestionNumber(1);
    setUserAnswer("");
    setFeedback("");
    setHearts(MAX_HEARTS);
    setLastResult("");
    setRetryQueue([]);
    setWrongAnswers(0);
    setRecentQuestionKeys([]);
    setQuestion(generateQuestionForMode(newMode, newLevels[0].values, [], 1));
  }

  function startLesson(levelId: number) {
    if (levelId > unlockedLevel) return;
    const selected = levels.find((l) => l.id === levelId) ?? levels[0];
    setCurrentLevel(selected.id);
    setScreen("lesson");
  }

  function startLevelPlay() {
    setScreen("play");
    setScore(0);
    setQuestionNumber(1);
    setUserAnswer("");
    setFeedback("");
    setHearts(MAX_HEARTS);
    setLastResult("");
    setRetryQueue([]);
    setWrongAnswers(0);
    setRecentQuestionKeys([]);
    setQuestion(generateQuestionForMode(mode, levelData.values, [], currentLevel));
  }

  function getNextQuestion(
    values: number[],
    queue: Question[],
    recentKeys: string[]
  ) {
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

    return generateQuestionForMode(mode, values, recentKeys, currentLevel);
  }

  function handleAnswer(answerValue: string) {
    let isCorrect = false;

    if (question.type === "fraction_recognition") {
      isCorrect = answerValue === question.answer;
    } else if (question.type === "fraction_compare") {
      isCorrect = answerValue === question.answer;
    } else {
      isCorrect = Number(answerValue) === question.answer;
    }

    let newScore = score;
    let newHearts = hearts;
    let newWrongAnswers = wrongAnswers;
    const newRetryQueue = [...retryQueue];

    setFeedback(getPedagogicalFeedback(question, isCorrect));
    setLastResult(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      newScore += 1;
    } else {
      newHearts -= 1;
      newWrongAnswers += 1;

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
    const baseQuestionsDone = questionNumber >= totalQuestions;
    const retryPending = newRetryQueue.length > 0;

    if (noMoreHearts || (baseQuestionsDone && !retryPending)) {
      let newUnlockedLevel = unlockedLevel;
      let newStars = stars;

      if (newScore >= passScore && newHearts > 0) {
        newUnlockedLevel = Math.min(currentLevel + 1, levels.length);
        if (newUnlockedLevel > unlockedLevel) {
          setUnlockedLevel(newUnlockedLevel);
        }
        newStars += 1;
        setStars(newStars);
      }

      saveProgress(mode, newUnlockedLevel, newStars);
      setScreen("result");
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
        levelData.values,
        newRetryQueue,
        updatedRecentKeys
      );

      setQuestion(nextQuestion);
    }, 1400);
  }

  function submitAnswer() {
    if (question.type !== "arithmetic") return;

    const value = Number(userAnswer);

    if (userAnswer.trim() === "" || Number.isNaN(value)) {
      setFeedback("Escribe una respuesta.");
      return;
    }

    handleAnswer(userAnswer);
  }

  const passed = score >= passScore && hearts > 0;
  const lesson = getLessonText(mode, levelData);

  function resetProgress() {
    localStorage.removeItem(getStorageKey(mode));
    setUnlockedLevel(1);
    setStars(0);
    setCurrentLevel(1);
    setScreen("map");
    setScore(0);
    setQuestionNumber(1);
    setUserAnswer("");
    setFeedback("");
    setHearts(MAX_HEARTS);
    setLastResult("");
    setRetryQueue([]);
    setWrongAnswers(0);
    setRecentQuestionKeys([]);
    setQuestion(generateQuestionForMode(mode, levels[0].values, [], 1));
  }

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

  const modeButton = (active: boolean): React.CSSProperties => ({
    background: active ? "#0f172a" : "#e2e8f0",
    color: active ? "white" : "#0f172a",
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  });

  const answerOptionStyle = (disabled = false): React.CSSProperties => ({
    background: disabled ? "#cbd5e1" : "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "16px 24px",
    fontSize: "24px",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    minWidth: "140px",
  });

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
                Aprende matemáticas paso a paso
              </h1>
              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  fontSize: "18px",
                  opacity: 0.95,
                }}
              >
                Lección corta, práctica, repaso de errores y evaluación.
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

              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "13px", opacity: 0.85 }}>Desbloqueado</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>Nivel {unlockedLevel}</div>
                </div>
                <div>
                  <div style={{ fontSize: "13px", opacity: 0.85 }}>Estrellas</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>⭐ {stars}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontWeight: "bold", color: "#334155" }}>Tema:</div>
            <button
              onClick={() => switchMode("multiplication")}
              style={modeButton(mode === "multiplication")}
            >
              ✖️ Multiplicación
            </button>
            <button
              onClick={() => switchMode("division")}
              style={modeButton(mode === "division")}
            >
              ➗ División
            </button>
            <button
              onClick={() => switchMode("fractions")}
              style={modeButton(mode === "fractions")}
            >
              🟩 Fracciones
            </button>
          </div>
        </div>

        {screen === "map" && (
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
                  <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "30px" }}>
                    Mapa de niveles
                  </h2>
                  <p style={{ margin: 0, color: "#475569", fontSize: "17px" }}>
                    Necesita al menos <strong>{passScore}/{totalQuestions}</strong> en este nivel y no quedarse sin corazones.
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
                const levelQuestions = getQuestionsPerLevel(mode, level.id);
                const levelPass = getPassScore(mode, level.id, levelQuestions);

                return (
                  <button
                    key={level.id}
                    onClick={() => startLesson(level.id)}
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
                            : `${levelQuestions} preguntas • pase ${levelPass}/${levelQuestions}`}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {screen === "lesson" && (
          <div style={cardStyle}>
            <div
              style={{
                display: "inline-block",
                background: levelData.color,
                color: "white",
                borderRadius: "999px",
                padding: "8px 14px",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              {levelData.name}
            </div>

            <h2 style={{ marginTop: 0, fontSize: "34px" }}>{lesson.title}</h2>
            <p
              style={{
                fontSize: "22px",
                color: "#334155",
                lineHeight: 1.5,
                whiteSpace: "pre-line",
              }}
            >
              {lesson.text}
            </p>

            {mode === "fractions" ? (
              <div
                style={{
                  background: "#eff6ff",
                  borderRadius: "20px",
                  padding: "20px",
                  margin: "24px 0",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#1e3a8a",
                    marginBottom: "12px",
                  }}
                >
                  {lesson.example}
                </div>
                {levelData.id === 6 ? (
                  <div style={{ display: "grid", gap: "16px", justifyItems: "center" }}>
                    <div style={{ width: "100%" }}>
                      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>A</div>
                      <FractionBar numerator={1} denominator={2} />
                    </div>
                    <div style={{ width: "100%" }}>
                      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>B</div>
                      <FractionBar numerator={1} denominator={3} />
                    </div>
                  </div>
                ) : (
                  <FractionBar
                    numerator={1}
                    denominator={levelData.values[0] ?? 2}
                  />
                )}
              </div>
            ) : (
              <div
                style={{
                  background: "#eff6ff",
                  borderRadius: "20px",
                  padding: "20px",
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#1e3a8a",
                  margin: "24px 0",
                  textAlign: "center",
                }}
              >
                {lesson.example}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={startLevelPlay} style={greenButton}>
                Empezar ejercicios
              </button>
              <button onClick={() => setScreen("map")} style={grayButton}>
                Volver al mapa
              </button>
            </div>
          </div>
        )}

        {screen === "play" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "20px" }}>
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
                    Pregunta {Math.min(questionNumber, totalQuestions)} de {totalQuestions}
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
                <div>Errores del nivel: <strong>{wrongAnswers}</strong></div>
                <div>Repasos pendientes: <strong>{retryQueue.length}</strong></div>
              </div>

              {question.type === "fraction_recognition" ? (
                <div style={{ textAlign: "center", margin: "30px 0" }}>
                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "bold",
                      color: "#0f172a",
                      marginBottom: "20px",
                    }}
                  >
                    ¿Qué fracción representa esta figura?
                  </div>

                  <FractionVisual
                    numerator={question.numerator}
                    denominator={question.denominator}
                    visualKind={question.visualKind}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginTop: "28px",
                    }}
                  >
                    {question.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        style={answerOptionStyle(lastResult !== "")}
                        disabled={lastResult !== ""}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      minHeight: "90px",
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
                      whiteSpace: "pre-line",
                    }}
                  >
                    {feedback}
                  </div>
                </div>
              ) : question.type === "fraction_compare" ? (
                <div style={{ textAlign: "center", margin: "30px 0" }}>
                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "bold",
                      color: "#0f172a",
                      marginBottom: "20px",
                    }}
                  >
                    ¿Cuál fracción es mayor?
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "20px",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "28px", marginBottom: "8px" }}>
                        A
                      </div>
                      <FractionVisual
                        numerator={question.leftNumerator}
                        denominator={question.leftDenominator}
                        visualKind={question.leftVisualKind}
                      />
                    </div>

                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "28px", marginBottom: "8px" }}>
                        B
                      </div>
                      <FractionVisual
                        numerator={question.rightNumerator}
                        denominator={question.rightDenominator}
                        visualKind={question.rightVisualKind}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginTop: "28px",
                    }}
                  >
                    <button
                      onClick={() => handleAnswer("left")}
                      style={answerOptionStyle(lastResult !== "")}
                      disabled={lastResult !== ""}
                    >
                      A
                    </button>
                    <button
                      onClick={() => handleAnswer("right")}
                      style={answerOptionStyle(lastResult !== "")}
                      disabled={lastResult !== ""}
                    >
                      B
                    </button>
                  </div>

                  <div
                    style={{
                      minHeight: "90px",
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
                      whiteSpace: "pre-line",
                    }}
                  >
                    {feedback}
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "72px",
                      fontWeight: "bold",
                      color: "#0f172a",
                      margin: "40px 0 30px",
                    }}
                  >
                    {mode === "multiplication"
                      ? `${question.promptA} × ${question.promptB}`
                      : `${question.promptA} ÷ ${question.promptB}`}
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

                    <button onClick={() => setScreen("map")} style={grayButton}>
                      Salir
                    </button>
                  </div>

                  <div
                    style={{
                      minHeight: "90px",
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
                      whiteSpace: "pre-line",
                    }}
                  >
                    {feedback}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {screen === "result" && (
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
                Puntaje final: <strong>{score}/{totalQuestions}</strong>
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
                  ? "Se quedó sin corazones. Conviene repetir y reforzar este tema antes de seguir."
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
                  <div style={{ color: "#64748b", marginBottom: "8px" }}>Resultado</div>
                  <div style={{ fontSize: "36px", fontWeight: "bold" }}>
                    {score}/{totalQuestions}
                  </div>
                </div>

                <div
                  style={{
                    background: "#fefce8",
                    borderRadius: "22px",
                    padding: "18px",
                  }}
                >
                  <div style={{ color: "#64748b", marginBottom: "8px" }}>Corazones</div>
                  <div style={{ fontSize: "36px", fontWeight: "bold" }}>{hearts}</div>
                </div>

                <div
                  style={{
                    background: "#ecfdf5",
                    borderRadius: "22px",
                    padding: "18px",
                  }}
                >
                  <div style={{ color: "#64748b", marginBottom: "8px" }}>Estrellas</div>
                  <div style={{ fontSize: "36px", fontWeight: "bold" }}>⭐ {stars}</div>
                </div>

                <div
                  style={{
                    background: "#fdf2f8",
                    borderRadius: "22px",
                    padding: "18px",
                  }}
                >
                  <div style={{ color: "#64748b", marginBottom: "8px" }}>Errores</div>
                  <div style={{ fontSize: "36px", fontWeight: "bold" }}>{wrongAnswers}</div>
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
                <button onClick={() => setScreen("lesson")} style={greenButton}>
                  Repetir nivel
                </button>

                {passed && currentLevel < levels.length && (
                  <button
                    onClick={() => {
                      setCurrentLevel(currentLevel + 1);
                      setScreen("lesson");
                    }}
                    style={primaryButton}
                  >
                    Siguiente nivel
                  </button>
                )}

                <button onClick={() => setScreen("map")} style={grayButton}>
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