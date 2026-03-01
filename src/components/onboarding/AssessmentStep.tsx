import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import ChipSelector from "./inputs/ChipSelector";
import HybridInput from "./inputs/HybridInput";

interface Props {
  identity: string;
  answers: Record<string, any>;
  onChange: (answers: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Question {
  key: string;
  question: string;
  type: "hybrid" | "single" | "multi" | "freetext";
  options?: { value: string; label: string }[];
  allowOther?: boolean;
  detailPrompt?: string;
}

const universalQuestions: Question[] = [
  {
    key: "working_style",
    question: "What does a truly good collaboration feel like for you — not in terms of output, but how it feels day-to-day?",
    type: "hybrid",
    options: [
      { value: "energising", label: "Energising and open" },
      { value: "structured", label: "Focused and structured" },
      { value: "trust_based", label: "Flexible and trust-based" },
    ],
    allowOther: true,
  },
  {
    key: "stress_response",
    question: "When a project gets hard or uncertain, what is your natural first response?",
    type: "hybrid",
    options: [
      { value: "push_through", label: "Push through and adapt" },
      { value: "step_back", label: "Step back and reassess" },
      { value: "talk_through", label: "Talk it through with the team" },
    ],
    allowOther: true,
  },
  {
    key: "recognition_style",
    question: "How do you like to share recognition when a team succeeds together?",
    type: "hybrid",
    options: [
      { value: "equal", label: "Spotlight on everyone equally" },
      { value: "work_speaks", label: "Let the work speak for itself" },
      { value: "specific", label: "Acknowledge each person's contribution" },
    ],
    allowOther: true,
  },
  {
    key: "step_back_reason",
    question: "What would make you step back from a collaboration — even if things looked fine on the surface?",
    type: "freetext",
  },
  {
    key: "communication_style",
    question: "Describe your ideal communication rhythm with someone you work closely with.",
    type: "single",
    options: [
      { value: "daily", label: "Daily sync" },
      { value: "few_times_week", label: "A few times a week" },
      { value: "async", label: "Async-first" },
      { value: "on_demand", label: "On-demand only" },
    ],
  },
];

const cofounderQuestions: Question[] = [
  {
    key: "vision_flexibility",
    question: "If the company needed to pivot completely away from the original idea, how would you approach that decision?",
    type: "hybrid",
    options: [
      { value: "embrace", label: "Embrace it if the data supports it" },
      { value: "depends", label: "It depends on how far we've come" },
      { value: "convincing", label: "I would need strong convincing" },
    ],
    allowOther: true,
  },
  {
    key: "equity_expectations",
    question: "How do you think about equity — not just the percentage, but what fairness truly means?",
    type: "hybrid",
    options: [
      { value: "equal", label: "Equal split always" },
      { value: "contribution", label: "Based on contribution over time" },
      { value: "risk", label: "Based on who takes the most risk" },
    ],
    allowOther: true,
  },
  {
    key: "decision_structure",
    question: "When you and a co-founder strongly disagree, how do you decide who gets the final call?",
    type: "single",
    options: [
      { value: "domain_owner", label: "Whoever owns that domain" },
      { value: "discuss", label: "Discuss until we align" },
      { value: "third_perspective", label: "Bring in a third perspective" },
      { value: "vote", label: "We vote" },
    ],
  },
  {
    key: "financial_runway",
    question: "What is your financial runway right now?",
    type: "single",
    options: [
      { value: "less_3m", label: "Less than 3 months" },
      { value: "3_6m", label: "3–6 months" },
      { value: "6_12m", label: "6–12 months" },
      { value: "more_1y", label: "More than a year" },
    ],
  },
  {
    key: "long_term_vision",
    question: "If the company succeeded beyond what you imagined — what role would you play?",
    type: "freetext",
  },
  {
    key: "past_collaboration",
    question: "Have you had a collaboration not work out before? What did you learn?",
    type: "freetext",
  },
  {
    key: "commitment_consistency",
    question: "How do you handle it when one co-founder's personal life creates an uneven workload?",
    type: "hybrid",
    options: [
      { value: "cover", label: "Give them space and cover" },
      { value: "discuss", label: "Discuss openly and adjust" },
      { value: "depends", label: "Depends on how long" },
    ],
    allowOther: true,
  },
  {
    key: "trust_style",
    question: "How do you feel when a partner naturally gravitates more toward your co-founder than toward you?",
    type: "hybrid",
    options: [
      { value: "unbothered", label: "It doesn't bother me" },
      { value: "understand", label: "I'd want to understand why" },
      { value: "affects_me", label: "It would affect me" },
    ],
    allowOther: true,
  },
  {
    key: "communication_depth",
    question: "What does feeling genuinely heard in a partnership mean to you?",
    type: "freetext",
  },
  {
    key: "work_life_balance",
    question: "How do you think about the boundary between personal life and building something you deeply care about?",
    type: "hybrid",
    options: [
      { value: "blur", label: "I blur the lines — it's all one life" },
      { value: "protect", label: "I protect personal time deliberately" },
      { value: "seasonal", label: "It shifts by season" },
    ],
    allowOther: true,
  },
  {
    key: "non_negotiables",
    question: "Is there anything you would not be willing to compromise on in a co-founding relationship?",
    type: "freetext",
  },
  {
    key: "mission_priority",
    question: "What does loyalty to a shared mission mean to you — especially when a better personal opportunity appears?",
    type: "hybrid",
    options: [
      { value: "mission_first", label: "The mission comes first" },
      { value: "coexist", label: "Personal growth and mission coexist" },
      { value: "stage_dependent", label: "Depends on the stage" },
    ],
    allowOther: true,
    detailPrompt: "Would you like to add anything about what that means for you? (Optional)",
  },
];

const teammateQuestions: Question[] = [
  {
    key: "ownership_style",
    question: "Do you prefer to own a specific area deeply, or contribute across areas?",
    type: "single",
    options: [
      { value: "deep", label: "Own a domain deeply" },
      { value: "broad", label: "Contribute broadly" },
      { value: "mix", label: "Mix of both" },
    ],
  },
  {
    key: "feedback_style",
    question: "How do you respond when someone gives you candid, critical feedback on your work?",
    type: "hybrid",
    options: [
      { value: "welcome", label: "I welcome it — helps me grow" },
      { value: "context", label: "I need context first" },
      { value: "written", label: "I prefer written feedback" },
    ],
    allowOther: true,
  },
  {
    key: "leadership_pref",
    question: "What kind of leadership brings out the best in you?",
    type: "multi",
    options: [
      { value: "structured", label: "Clear direction and structure" },
      { value: "autonomous", label: "Trust and autonomy" },
      { value: "collaborative", label: "Collaborative and flat" },
      { value: "mentoring", label: "Mentoring and growth-focused" },
    ],
  },
  {
    key: "autonomy_level",
    question: "How important is understanding the 'why' behind what you're building?",
    type: "single",
    options: [
      { value: "very", label: "Very — I need to believe in it" },
      { value: "helpful", label: "Helpful but not essential" },
      { value: "execution", label: "I focus on excellent execution" },
    ],
  },
  {
    key: "adaptability",
    question: "How do you handle it when priorities shift suddenly?",
    type: "hybrid",
    options: [
      { value: "adapt", label: "I adapt quickly" },
      { value: "recalibrate", label: "I need a moment to recalibrate" },
      { value: "understand", label: "I need to understand why first" },
    ],
    allowOther: true,
  },
  {
    key: "motivation_style",
    question: "What does recognition for strong work feel like to you?",
    type: "hybrid",
    options: [
      { value: "acknowledgement", label: "A simple acknowledgement" },
      { value: "public", label: "Public recognition matters" },
      { value: "results", label: "Results are their own reward" },
    ],
    allowOther: true,
  },
  {
    key: "conflict_style",
    question: "When a conflict arises with a teammate, how do you prefer to address it?",
    type: "single",
    options: [
      { value: "directly", label: "Directly and immediately" },
      { value: "calmly", label: "Calmly when both are ready" },
      { value: "gradually", label: "Gradually over time" },
      { value: "mediator", label: "Through a mediator" },
    ],
  },
  {
    key: "commitment_type",
    question: "Are you looking for a long-term role or project-based contribution?",
    type: "single",
    options: [
      { value: "ft", label: "Long-term full-time" },
      { value: "pt", label: "Long-term part-time" },
      { value: "project", label: "Project-based" },
      { value: "open", label: "Open to either" },
    ],
  },
  {
    key: "ideal_environment",
    question: "What kind of team dynamic has brought out your very best work?",
    type: "freetext",
  },
  {
    key: "startup_readiness",
    question: "How comfortable are you in early-stage environments where processes are still being figured out?",
    type: "single",
    options: [
      { value: "very", label: "Very — I thrive in ambiguity" },
      { value: "somewhat", label: "Somewhat comfortable" },
      { value: "structure", label: "I prefer more structure" },
    ],
  },
  {
    key: "dealbreakers",
    question: "What would make you leave a team — even if you genuinely liked the people?",
    type: "freetext",
  },
  {
    key: "assertiveness",
    question: "How do you balance being a strong team player with advocating for your own ideas?",
    type: "hybrid",
    options: [
      { value: "collaborative", label: "Advocate firmly but collaboratively" },
      { value: "go_with_team", label: "I tend to go with the team" },
      { value: "lead", label: "I lead with my ideas and adjust" },
    ],
    allowOther: true,
  },
];

const clientQuestions: Question[] = [
  {
    key: "involvement_pref",
    question: "How involved do you want to be in day-to-day execution?",
    type: "single",
    options: [
      { value: "very", label: "Very involved" },
      { value: "milestones", label: "At key milestones" },
      { value: "hands_off", label: "Hands-off — I trust the team" },
    ],
  },
  {
    key: "communication_rhythm",
    question: "How do you prefer to stay connected with a partner or team?",
    type: "single",
    options: [
      { value: "daily", label: "Daily check-ins" },
      { value: "weekly", label: "Weekly updates" },
      { value: "async", label: "Async — I'll check when needed" },
      { value: "on_demand", label: "On-demand only" },
    ],
  },
  {
    key: "relationship_style",
    question: "What does a successful working relationship with an external partner look like to you?",
    type: "freetext",
  },
  {
    key: "feedback_style",
    question: "How do you handle it when a deliverable doesn't meet expectations the first time?",
    type: "hybrid",
    options: [
      { value: "iterate", label: "Clear feedback and iterate" },
      { value: "understand", label: "Understand what went wrong first" },
      { value: "depends", label: "Depends on the severity" },
    ],
    allowOther: true,
  },
  {
    key: "decision_speed",
    question: "How quickly do you typically move when making decisions?",
    type: "single",
    options: [
      { value: "fast", label: "Fast — I decide quickly" },
      { value: "moderate", label: "Moderate — a few days" },
      { value: "careful", label: "Careful — I need time" },
    ],
  },
  {
    key: "scope_clarity",
    question: "How defined is your brief usually?",
    type: "single",
    options: [
      { value: "mapped", label: "Fully mapped out" },
      { value: "directional", label: "Directional — open to iteration" },
      { value: "open", label: "Very open — rely on expertise" },
    ],
  },
  {
    key: "budget_philosophy",
    question: "When investing in a collaboration, what is your primary driver?",
    type: "multi",
    options: [
      { value: "speed", label: "Speed to delivery" },
      { value: "quality", label: "Quality of output" },
      { value: "value", label: "Value for investment" },
      { value: "relationship", label: "Long-term relationship" },
    ],
  },
  {
    key: "past_collab_exp",
    question: "Have you worked with an external team before? What worked and what didn't?",
    type: "freetext",
  },
  {
    key: "trust_style",
    question: "How comfortable are you giving creative or strategic autonomy to people you bring in?",
    type: "single",
    options: [
      { value: "very", label: "Very comfortable" },
      { value: "somewhat", label: "Somewhat — with check-ins" },
      { value: "close", label: "I stay closely involved" },
    ],
  },
  {
    key: "timeline_style",
    question: "How do you think about timelines?",
    type: "single",
    options: [
      { value: "firm", label: "Firm deadlines" },
      { value: "flexible", label: "Flexible milestones" },
      { value: "outcome", label: "Outcome-focused" },
    ],
  },
  {
    key: "adaptability",
    question: "How would you approach it if a project needed more time or budget than planned?",
    type: "hybrid",
    options: [
      { value: "adjust", label: "Reassess and adjust together" },
      { value: "depends", label: "Depends on the reason" },
      { value: "justify", label: "I'd need strong justification" },
    ],
    allowOther: true,
  },
  {
    key: "success_criteria",
    question: "What would make you enthusiastically refer someone you worked with to your network?",
    type: "freetext",
  },
];

function getTrackQuestions(identity: string, intent: string): Question[] {
  const extra: Question[] = [];
  if (identity === "founder" && (intent === "cofounder" || intent === "all")) {
    extra.push(...cofounderQuestions);
  } else if (identity === "professional" || intent === "teammates") {
    extra.push(...teammateQuestions);
  } else if (identity === "organisation" || intent === "clients") {
    extra.push(...clientQuestions);
  }
  return [...universalQuestions, ...extra];
}

const AssessmentStep = ({ identity, answers, onChange, onNext, onBack }: Props) => {
  const allQuestions = getTrackQuestions(identity, answers._intent || "");
  const [current, setCurrent] = useState(0);
  const q = allQuestions[current];

  const getAnswer = (key: string) => answers[key] || "";
  const getOther = (key: string) => answers[`${key}_other`] || "";
  const getDetail = (key: string) => answers[`${key}_detail`] || "";

  const setAnswer = (key: string, val: any) => {
    onChange({ ...answers, [key]: val });
  };

  const hasAnswer = () => {
    const val = getAnswer(q.key);
    if (q.type === "freetext") return (val as string).trim().length > 0;
    if (q.type === "multi") return Array.isArray(val) && val.length > 0;
    return !!val;
  };

  const answeredCount = allQuestions.filter((q) => {
    const val = answers[q.key];
    if (q.type === "freetext") return (val || "").trim().length > 0;
    if (q.type === "multi") return Array.isArray(val) && val.length > 0;
    return !!val;
  }).length;

  const allDone = answeredCount === allQuestions.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-800 text-foreground mb-2">
          Deep assessment
        </h1>
        <p className="text-muted-foreground">
          These questions help us understand how you work, what you value, and what makes partnerships thrive for you.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1 mb-2">
        {allQuestions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer
              ${i < current ? "gradient-hero" : i === current ? "bg-accent" : "bg-secondary"}`}
          />
        ))}
      </div>

      <motion.div
        key={current}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <p className="text-xs text-muted-foreground">
          Question {current + 1} of {allQuestions.length}
        </p>

        {/* Render based on question type */}
        {q.type === "freetext" && (
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground leading-relaxed">{q.question}</p>
            <Textarea
              value={getAnswer(q.key) as string}
              onChange={(e) => setAnswer(q.key, e.target.value)}
              placeholder="Take your time to reflect..."
              className="min-h-[140px] resize-none"
            />
          </div>
        )}

        {q.type === "single" && (
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground leading-relaxed">{q.question}</p>
            <ChipSelector
              options={q.options || []}
              selected={getAnswer(q.key) as string}
              onChange={(val) => setAnswer(q.key, val)}
              multi={false}
              allowOther={q.allowOther}
              otherValue={getOther(q.key)}
              onOtherChange={(val) => setAnswer(`${q.key}_other`, val)}
            />
          </div>
        )}

        {q.type === "multi" && (
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground leading-relaxed">{q.question}</p>
            <ChipSelector
              options={q.options || []}
              selected={(getAnswer(q.key) as string[]) || []}
              onChange={(val) => setAnswer(q.key, val)}
              multi={true}
              allowOther={q.allowOther}
              otherValue={getOther(q.key)}
              onOtherChange={(val) => setAnswer(`${q.key}_other`, val)}
            />
          </div>
        )}

        {q.type === "hybrid" && (
          <HybridInput
            question={q.question}
            options={q.options || []}
            selected={getAnswer(q.key)}
            onChange={(val) => setAnswer(q.key, val)}
            multi={false}
            allowOther={q.allowOther}
            otherValue={getOther(q.key)}
            onOtherChange={(val) => setAnswer(`${q.key}_other`, val)}
            detailPrompt={q.detailPrompt}
            detailValue={getDetail(q.key)}
            onDetailChange={(val) => setAnswer(`${q.key}_detail`, val)}
          />
        )}
      </motion.div>

      <div className="flex gap-3">
        {current > 0 ? (
          <Button variant="outline" onClick={() => setCurrent(current - 1)} className="h-12">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        ) : (
          <Button variant="outline" onClick={onBack} className="h-12">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        {current < allQuestions.length - 1 ? (
          <Button
            onClick={() => setCurrent(current + 1)}
            disabled={!hasAnswer()}
            className="flex-1 gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12 text-base"
          >
            Next Question
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!allDone}
            className="flex-1 gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12 text-base"
          >
            Complete & Find Matches
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssessmentStep;
