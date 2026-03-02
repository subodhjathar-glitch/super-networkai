import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props {
  ikigai: { love: string; good: string; world: string; livelihood: string };
  onChange: (ikigai: Props["ikigai"]) => void;
  onNext: () => void;
  onBack: () => void;
}

const questions = [
  {
    key: "love" as const,
    label: "What do you love?",
    prompt: "What activities, topics, or types of work make you feel most alive? Think about moments when you lose track of time — not because you have to, but because you genuinely want to keep going.",
    placeholder: "e.g. I love solving complex problems with a small team, designing experiences that simplify people's lives, mentoring early-career professionals, building things from scratch where nothing existed before...",
    circle: "Love",
    color: "var(--ikigai-love)",
  },
  {
    key: "good" as const,
    label: "What are you good at?",
    prompt: "What skills, abilities, or strengths do people consistently recognise in you? Think about what others come to you for — the things you do well, even when you're not trying.",
    placeholder: "e.g. I'm naturally good at breaking down ambiguous problems into clear steps, connecting people who should know each other, writing that makes complex ideas accessible, staying calm under pressure...",
    circle: "Skill",
    color: "var(--ikigai-good)",
  },
  {
    key: "world" as const,
    label: "What does the world need?",
    prompt: "What problems, gaps, or injustices in the world feel personal to you? What change would you work toward even if no one was watching or paying you?",
    placeholder: "e.g. Better access to quality education regardless of where you're born, more ethical use of AI in hiring, affordable mental health support for founders, bridging the gap between rural talent and global opportunities...",
    circle: "Need",
    color: "var(--ikigai-world)",
  },
  {
    key: "livelihood" as const,
    label: "What can you be paid for?",
    prompt: "What skills, expertise, or value can you offer that people or organisations would pay for? Think broadly — this isn't just your current job, but what you could realistically build a livelihood around.",
    placeholder: "e.g. Product strategy consulting, full-stack development, leadership coaching, content creation and brand storytelling, data analysis and business intelligence...",
    circle: "Value",
    color: "var(--ikigai-livelihood)",
  },
];

const MIN_CHARS = 20;

const IkigaiStep = ({ ikigai, onChange, onNext, onBack }: Props) => {
  const [activeQ, setActiveQ] = useState(0);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const filled = questions.filter((q) => ikigai[q.key].trim().length >= MIN_CHARS);
  const allFilled = filled.length === 4;

  const circles = [
    { cx: 130, cy: 120, key: "love" as const, color: "hsl(var(--ikigai-love))" },
    { cx: 200, cy: 120, key: "good" as const, color: "hsl(var(--ikigai-good))" },
    { cx: 130, cy: 185, key: "world" as const, color: "hsl(var(--ikigai-world))" },
    { cx: 200, cy: 185, key: "livelihood" as const, color: "hsl(var(--ikigai-livelihood))" },
  ];

  const handleAnswer = (value: string) => {
    onChange({ ...ikigai, [questions[activeQ].key]: value });
  };

  // Generate AI interpretation when all 4 are filled
  const generateAiSummary = async () => {
    if (generatingSummary || aiSummary) return;
    setGeneratingSummary(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-ikigai`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ikigai }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary || null);
      }
    } catch (e) {
      console.error("Ikigai AI summary error:", e);
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Trigger when all filled
  if (allFilled && !aiSummary && !generatingSummary) {
    generateAiSummary();
  }

  const currentQ = questions[activeQ];
  const currentLen = ikigai[currentQ.key].trim().length;
  const currentValid = currentLen >= MIN_CHARS;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-800 text-foreground mb-2">
          Discover your Ikigai
        </h1>
        <p className="text-muted-foreground">
          Ikigai (生き甲斐) is a Japanese concept meaning "your reason for being" — the intersection of what you love, what you're good at, what the world needs, and what you can be paid for. Take your time with each question — the more honest and detailed you are, the better your matches will be.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Animated Chart */}
        <div className="flex justify-center">
          <svg viewBox="0 0 330 310" className="w-full max-w-[300px]">
            {circles.map((c, i) => {
              const isFilled = ikigai[c.key].trim().length >= MIN_CHARS;
              return (
                <motion.circle
                  key={c.key}
                  cx={c.cx}
                  cy={c.cy}
                  r="75"
                  fill={c.color}
                  stroke={c.color}
                  strokeWidth="2"
                  strokeOpacity={0.5}
                  initial={{ fillOpacity: 0.05 }}
                  animate={{ fillOpacity: isFilled ? 0.25 : 0.05 }}
                  transition={{ duration: 0.6 }}
                  className="cursor-pointer"
                  onClick={() => setActiveQ(i)}
                />
              );
            })}
            {/* Center */}
            <motion.circle
              cx="165"
              cy="152"
              r={10 + filled.length * 8}
              fill="hsl(var(--indigo-highlight))"
              animate={{ fillOpacity: filled.length > 0 ? 0.3 : 0.05, r: 10 + filled.length * 8 }}
              transition={{ duration: 0.6 }}
            />
            {allFilled && (
              <motion.text
                x="165"
                y="157"
                textAnchor="middle"
                fill="hsl(var(--primary))"
                fontSize="10"
                fontWeight="700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                IKIGAI
              </motion.text>
            )}
            {/* Labels */}
            {[
              { x: 90, y: 60, label: "Love" },
              { x: 240, y: 60, label: "Skill" },
              { x: 85, y: 265, label: "Need" },
              { x: 235, y: 265, label: "Value" },
            ].map((l) => (
              <text key={l.label} x={l.x} y={l.y} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11" fontWeight="500">
                {l.label}
              </text>
            ))}
          </svg>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex gap-2 mb-2">
            {questions.map((q, i) => (
              <button
                key={q.key}
                onClick={() => setActiveQ(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === activeQ ? "scale-125" : "opacity-50"
                }`}
                style={{ backgroundColor: `hsl(${q.color})` }}
              />
            ))}
          </div>
          <p className="text-base font-semibold text-foreground mb-1">
            {currentQ.label} <span className="text-destructive">*</span>
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            {currentQ.prompt}
          </p>
          <Textarea
            value={ikigai[currentQ.key]}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder={currentQ.placeholder}
            className="min-h-[140px] resize-none"
          />
          <div className="flex items-center justify-between">
            <p className={`text-xs ${currentValid ? "text-muted-foreground" : "text-destructive"}`}>
              {currentLen}/{MIN_CHARS} min characters
              {currentValid && " ✓"}
            </p>
            {activeQ < 3 && currentValid && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveQ(activeQ + 1)}
              >
                Next question →
              </Button>
            )}
          </div>

          {/* AI Interpretation */}
          {allFilled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-sm text-foreground"
            >
              {generatingSummary ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span className="text-muted-foreground">Generating your Ikigai interpretation...</span>
                </div>
              ) : aiSummary ? (
                <>
                  <span className="font-semibold text-accent">✨ Your Ikigai:</span>{" "}
                  {aiSummary}
                </>
              ) : (
                <>
                  <span className="font-semibold text-accent">✨ Ikigai discovered:</span>{" "}
                  All four dimensions of your Ikigai are complete. Your answers will power vision alignment matching.
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="h-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!allFilled}
          className="flex-1 gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12 text-base"
        >
          Continue to Assessment
        </Button>
      </div>
    </div>
  );
};

export default IkigaiStep;
