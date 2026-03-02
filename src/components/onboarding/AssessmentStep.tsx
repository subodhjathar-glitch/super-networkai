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
      { value: "energising", label: "Energising and open — ideas flow freely, there's creative tension, and we push each other forward" },
      { value: "structured", label: "Focused and structured — clear roles, defined goals, and everyone knows what they're responsible for" },
      { value: "trust_based", label: "Flexible and trust-based — we don't micromanage, we give each other space and check in when needed" },
      { value: "supportive", label: "Supportive and safe — I can be honest, make mistakes, and still feel valued by the team" },
    ],
    allowOther: true,
    detailPrompt: "Want to describe your ideal collaboration experience in more detail? (Optional — but helps us match you better)",
  },
  {
    key: "stress_response",
    question: "When a project gets hard or uncertain, what is your natural first response?",
    type: "hybrid",
    options: [
      { value: "push_through", label: "Push through and adapt — I get more focused under pressure and find ways to move forward" },
      { value: "step_back", label: "Step back and reassess — I need to understand the full picture before deciding how to proceed" },
      { value: "talk_through", label: "Talk it through with the team — I process best by discussing and hearing different perspectives" },
      { value: "take_space", label: "Take space first — I process internally before I can respond constructively" },
    ],
    allowOther: true,
  },
  {
    key: "recognition_style",
    question: "How do you like to share recognition when a team succeeds together?",
    type: "hybrid",
    options: [
      { value: "equal", label: "Shine the spotlight on everyone equally — every person's contribution matters and should be acknowledged" },
      { value: "work_speaks", label: "Let the work speak for itself — I don't need external recognition, the outcome is enough" },
      { value: "specific", label: "Acknowledge each person's specific contribution — I like calling out what exactly each person brought" },
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
      { value: "daily", label: "Daily sync — even a quick check-in keeps us aligned and prevents things from drifting" },
      { value: "few_times_week", label: "A few times a week — enough to stay connected, but not so much that it disrupts deep work" },
      { value: "async", label: "Async-first — I prefer written updates, voice notes, or shared docs over scheduled meetings" },
      { value: "on_demand", label: "On-demand only — reach out when there's something meaningful to discuss, not on a fixed schedule" },
    ],
  },
];

const cofounderQuestions: Question[] = [
  {
    key: "vision_flexibility",
    question: "If the company needed to pivot completely away from the original idea, how would you approach that decision?",
    type: "hybrid",
    options: [
      { value: "embrace", label: "Embrace it if the data supports it — I'm building a company, not married to one idea" },
      { value: "depends", label: "It depends on how far we've come — if we've invested years, I'd need a very strong case for change" },
      { value: "convincing", label: "I'd need strong convincing — I believe in staying the course and not chasing every new signal" },
    ],
    allowOther: true,
    detailPrompt: "Have you ever been through a pivot? What was that like? (Optional)",
  },
  {
    key: "equity_expectations",
    question: "How do you think about equity — not just the percentage, but what fairness truly means?",
    type: "hybrid",
    options: [
      { value: "equal", label: "Equal split always — we're in this together from day one, and equal ownership reflects that commitment" },
      { value: "contribution", label: "Based on contribution over time — equity should reflect who's actually putting in the work consistently" },
      { value: "risk", label: "Based on who takes the most risk — whoever is sacrificing more should be compensated" },
    ],
    allowOther: true,
  },
  {
    key: "decision_structure",
    question: "When you and a co-founder strongly disagree, how do you decide who gets the final call?",
    type: "single",
    options: [
      { value: "domain_owner", label: "Whoever owns that domain decides — we each have areas of expertise and should trust that" },
      { value: "discuss", label: "We discuss until we align — I won't move forward unless we're both truly on board" },
      { value: "third_perspective", label: "We bring in a third perspective — an advisor or mentor to help us see what we might be missing" },
      { value: "vote", label: "We vote — democratic decision-making keeps things fair and efficient" },
    ],
  },
  {
    key: "financial_runway",
    question: "What is your financial runway right now?",
    type: "single",
    options: [
      { value: "less_3m", label: "Less than 3 months — I need to figure out income soon" },
      { value: "3_6m", label: "3 to 6 months — enough to get started, but I'll need revenue or funding" },
      { value: "6_12m", label: "6 to 12 months — I've planned for this and can stay focused" },
      { value: "more_1y", label: "More than a year — I'm financially prepared to commit long-term" },
    ],
  },
  {
    key: "long_term_vision",
    question: "If the company succeeded beyond what you imagined — what role would you play? What would your life look like?",
    type: "freetext",
  },
  {
    key: "past_collaboration",
    question: "Have you had a collaboration not work out before? What did you learn about yourself from that experience?",
    type: "freetext",
  },
  {
    key: "commitment_consistency",
    question: "How do you handle it when one co-founder's personal life creates an uneven workload for a period?",
    type: "hybrid",
    options: [
      { value: "cover", label: "Give them space and cover for a while — life happens, and I'd want the same support in return" },
      { value: "discuss", label: "Discuss openly and adjust expectations — so resentment doesn't build" },
      { value: "depends", label: "It would depend on how long — I can handle a few weeks, but months of imbalance would be a problem" },
    ],
    allowOther: true,
  },
  {
    key: "trust_style",
    question: "How do you feel when a partner or investor naturally gravitates more toward your co-founder than toward you?",
    type: "hybrid",
    options: [
      { value: "unbothered", label: "It doesn't bother me — I'm confident in my own contributions regardless" },
      { value: "understand", label: "I'd want to understand why — is it personality, or are they seeing something I'm not?" },
      { value: "affected", label: "It would affect me — I value being seen and recognised for my role" },
    ],
    allowOther: true,
    detailPrompt: "What would break trust for you? (Optional)",
  },
  {
    key: "communication_depth",
    question: "What does feeling genuinely heard in a partnership mean to you? Describe what that looks like.",
    type: "freetext",
  },
  {
    key: "work_life_balance",
    question: "How do you think about the boundary between your personal life and building something you deeply care about?",
    type: "hybrid",
    options: [
      { value: "blur", label: "I blur the lines intentionally — it's all one life to me" },
      { value: "protect", label: "I protect personal time deliberately — I'm more effective when I have space to recharge" },
      { value: "seasonal", label: "It shifts by season — during launches I go all-in, then I pull back to recover" },
    ],
    allowOther: true,
  },
  {
    key: "non_negotiables",
    question: "Is there anything you would not be willing to compromise on in a co-founding relationship? Be specific.",
    type: "freetext",
  },
  {
    key: "mission_priority",
    question: "What does loyalty to a shared mission mean to you — especially when a better personal opportunity appears?",
    type: "hybrid",
    options: [
      { value: "mission_first", label: "The mission comes first — I committed, and I follow through even when something shinier shows up" },
      { value: "coexist", label: "Personal growth and the mission can coexist — I'd explore whether both can be served" },
      { value: "stage_dependent", label: "It depends on the stage — early on I'm all-in; later, it's fair to re-evaluate" },
    ],
    allowOther: true,
    detailPrompt: "Can you tell us a little more about what that means for you? (Optional — takes 10 seconds)",
  },
];

const teammateQuestions: Question[] = [
  {
    key: "ownership_style",
    question: "Do you prefer to own a specific area deeply, or contribute across areas as needs arise?",
    type: "single",
    options: [
      { value: "deep", label: "Own a domain deeply — I do my best work when I can go deep and become the expert" },
      { value: "broad", label: "Contribute broadly — variety keeps me engaged, and I enjoy connecting dots across domains" },
      { value: "mix", label: "Mix of both — I want a primary focus but enjoy stepping into other areas when needed" },
    ],
  },
  {
    key: "feedback_style",
    question: "How do you respond when someone gives you candid, critical feedback on your work?",
    type: "hybrid",
    options: [
      { value: "welcome", label: "I welcome it — it helps me grow, and I'd rather hear the hard truth than polite vagueness" },
      { value: "context", label: "I need context first — I receive feedback better when I understand the reasoning behind it" },
      { value: "written", label: "I prefer written feedback — it gives me time to process without reacting emotionally" },
    ],
    allowOther: true,
    detailPrompt: "How do you prefer to give feedback to others? (Optional)",
  },
  {
    key: "leadership_pref",
    question: "What kind of leadership brings out the very best in you? Select all that apply.",
    type: "multi",
    options: [
      { value: "structured", label: "Clear direction and structure — I thrive when expectations and priorities are well-defined" },
      { value: "autonomous", label: "Trust and autonomy — give me the goal and let me figure out how to get there" },
      { value: "collaborative", label: "Collaborative and flat — I do best where everyone's voice carries equal weight" },
      { value: "mentoring", label: "Mentoring and growth-focused — I want a leader who invests in my development" },
    ],
    allowOther: true,
  },
  {
    key: "autonomy_level",
    question: "How important is understanding the 'why' behind what you are building?",
    type: "single",
    options: [
      { value: "very", label: "Very — I need to believe in the purpose; I can't just execute without the bigger picture" },
      { value: "helpful", label: "Helpful but not essential — I appreciate context, but I can deliver great work either way" },
      { value: "execution", label: "I focus on excellent execution — tell me what needs to be done, and I'll make it exceptional" },
    ],
  },
  {
    key: "adaptability",
    question: "How do you handle it when priorities shift suddenly?",
    type: "hybrid",
    options: [
      { value: "adapt", label: "I adapt quickly — I understand things change, and I can switch gears without losing momentum" },
      { value: "recalibrate", label: "I need a moment to recalibrate — a brief pause to reorganise and adjust my plan" },
      { value: "understand", label: "I like to understand why before shifting — context helps me buy in" },
    ],
    allowOther: true,
  },
  {
    key: "motivation_style",
    question: "What does recognition for strong work feel like to you in a team setting?",
    type: "hybrid",
    options: [
      { value: "simple", label: "A simple acknowledgement goes a long way — knowing my work was noticed is enough" },
      { value: "public", label: "Public recognition matters to me — I value being celebrated for what I contribute" },
      { value: "results", label: "Results are their own reward — I don't need external recognition, the impact is enough" },
    ],
    allowOther: true,
  },
  {
    key: "conflict_style",
    question: "When a conflict arises with a teammate, how do you prefer to address it?",
    type: "single",
    options: [
      { value: "directly", label: "Directly and immediately — address things head-on before they grow into bigger issues" },
      { value: "calmly", label: "Calmly when both sides are ready — wait until emotions settle for a productive conversation" },
      { value: "gradually", label: "Gradually over time — work through it in smaller, natural moments" },
      { value: "mediator", label: "Through a mediator — having someone else facilitate makes the conversation safer" },
    ],
  },
  {
    key: "commitment_type",
    question: "Are you looking for a long-term role or a project-based contribution?",
    type: "single",
    options: [
      { value: "ft", label: "Long-term full-time — I want to fully commit and grow with a team over years" },
      { value: "pt", label: "Long-term part-time — I want ongoing involvement but have other commitments" },
      { value: "project", label: "Project-based — I prefer defined engagements with clear start and end dates" },
      { value: "open", label: "Open to either — the right opportunity matters more than the structure" },
    ],
  },
  {
    key: "ideal_environment",
    question: "What kind of team dynamic has brought out your very best work? Describe what made it special.",
    type: "freetext",
  },
  {
    key: "startup_readiness",
    question: "How comfortable are you in early-stage environments where processes are still being figured out?",
    type: "single",
    options: [
      { value: "very", label: "Very comfortable — I thrive in ambiguity and enjoy building systems from scratch" },
      { value: "somewhat", label: "Somewhat comfortable — I can handle it but I'm more productive once basics are in place" },
      { value: "structure", label: "I prefer more structure — I do my best work with established processes and clear expectations" },
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
      { value: "collaborative", label: "I advocate firmly but collaboratively — I share my perspective strongly and genuinely listen" },
      { value: "go_with_team", label: "I tend to go with the team — harmony matters, and I trust the group's collective wisdom" },
      { value: "lead", label: "I lead with my ideas and adjust — I'm naturally opinionated but willing to change with evidence" },
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
      { value: "very", label: "Very involved — I like to be close to the work, reviewing regularly and shaping direction" },
      { value: "milestones", label: "Involved at key milestones — meaningful check-ins at important stages" },
      { value: "hands_off", label: "Hands-off — I trust the team and prefer to see results rather than manage the process" },
    ],
  },
  {
    key: "communication_rhythm",
    question: "How do you prefer to stay connected with a partner or team?",
    type: "single",
    options: [
      { value: "daily", label: "Daily check-ins — even brief updates keep me confident things are on track" },
      { value: "weekly", label: "Weekly updates — a structured summary each week is the right balance" },
      { value: "async", label: "Async — I'll check shared documents and dashboards when I have time" },
      { value: "on_demand", label: "On-demand only — reach out when there's a decision needed or a blocker" },
    ],
  },
  {
    key: "relationship_style",
    question: "What does a successful working relationship with an external partner look like to you? Describe your ideal experience.",
    type: "freetext",
  },
  {
    key: "feedback_style",
    question: "How do you handle it when a deliverable does not meet expectations the first time?",
    type: "hybrid",
    options: [
      { value: "iterate", label: "Provide clear feedback and iterate — it's normal and part of the process" },
      { value: "understand", label: "Understand what went wrong first — was it miscommunication, or a capability issue?" },
      { value: "depends", label: "It depends on the severity — small misses are fine, but a complete miss raises concerns" },
    ],
    allowOther: true,
  },
  {
    key: "decision_speed",
    question: "How quickly do you typically move when reviewing proposals or making decisions?",
    type: "single",
    options: [
      { value: "fast", label: "Fast — I decide quickly and prefer to course-correct rather than over-analyse" },
      { value: "moderate", label: "Moderate — a few days to consider options, then I commit fully" },
      { value: "careful", label: "Careful — I need time, data, and sometimes external input before deciding" },
    ],
  },
  {
    key: "scope_clarity",
    question: "How defined is your brief usually when you bring someone in?",
    type: "single",
    options: [
      { value: "mapped", label: "Fully mapped out — I know exactly what I want and need execution against a clear plan" },
      { value: "directional", label: "Directional — I have a strong sense of direction but I'm open to iteration" },
      { value: "open", label: "Very open — I rely on the team's expertise to help define the scope" },
    ],
  },
  {
    key: "budget_philosophy",
    question: "When investing in a collaboration, what is your primary driver? Select all that apply.",
    type: "multi",
    options: [
      { value: "speed", label: "Speed to delivery — getting to results quickly is worth paying a premium" },
      { value: "quality", label: "Quality of output — I'd rather wait longer for work that's genuinely excellent" },
      { value: "value", label: "Value for investment — every dollar should generate meaningful return" },
      { value: "relationship", label: "Long-term relationship — I want a partner I can work with repeatedly" },
    ],
    allowOther: true,
  },
  {
    key: "past_collab_exp",
    question: "Have you worked with an external team or collaborator before? What worked and what didn't?",
    type: "freetext",
  },
  {
    key: "trust_style",
    question: "How comfortable are you giving creative or strategic autonomy to the people you bring in?",
    type: "single",
    options: [
      { value: "very", label: "Very comfortable — I hire smart people so they can bring perspectives I wouldn't have" },
      { value: "somewhat", label: "Somewhat — I'm open to their ideas but want regular check-ins to stay aligned" },
      { value: "close", label: "I stay closely involved — I have a clear vision and need alignment" },
    ],
  },
  {
    key: "timeline_style",
    question: "How do you think about timelines and deadlines?",
    type: "single",
    options: [
      { value: "firm", label: "Firm deadlines — non-negotiable; delays have real consequences" },
      { value: "flexible", label: "Flexible milestones — I set targets but understand quality takes time" },
      { value: "outcome", label: "Outcome-focused — I care more about the result than an arbitrary date" },
    ],
  },
  {
    key: "adaptability",
    question: "How would you approach it if a project needed more time or budget than planned?",
    type: "hybrid",
    options: [
      { value: "adjust", label: "Reassess and adjust together — if the reasons are valid, I'm willing to invest more" },
      { value: "depends", label: "It depends on the reason — genuine discovery is fine; poor planning is a problem" },
      { value: "justify", label: "I'd need strong justification — I set budgets deliberately and expect them to be respected" },
    ],
    allowOther: true,
  },
  {
    key: "success_criteria",
    question: "What would make you enthusiastically refer someone you worked with to your entire network?",
    type: "freetext",
  },
];

function getTrackQuestions(identity: string, intent: string): Question[] {
  const extra: Question[] = [];

  // Intent determines the primary question track
  if (intent === "cofounder") {
    extra.push(...cofounderQuestions);
  } else if (intent === "teammates") {
    extra.push(...teammateQuestions);
  } else if (intent === "clients") {
    extra.push(...clientQuestions);
  } else if (intent === "all") {
    // "All" falls back to identity-based primary track
    if (identity === "founder") extra.push(...cofounderQuestions);
    else if (identity === "professional") extra.push(...teammateQuestions);
    else if (identity === "organisation") extra.push(...clientQuestions);
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
        <p className="text-muted-foreground mb-3">
          These questions help us understand how you work, what you value, and what makes partnerships thrive for you.
        </p>
        <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3 text-sm text-foreground">
          <span className="font-semibold text-accent">💡 Take your time.</span>{" "}
          This may take 10–15 minutes, but the more thoughtful and detailed your answers, the better your matches will be. 
          Choose the options that resonate most, and use "Other" to add anything that's uniquely you.
        </div>
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
