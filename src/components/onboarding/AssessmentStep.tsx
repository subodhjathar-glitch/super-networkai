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
    question: "What does a truly good collaboration feel like for you — not the output, but the day-to-day experience?",
    type: "hybrid",
    options: [
      { value: "energising", label: "It feels energising — ideas flow freely, there's creative tension, and we push each other forward" },
      { value: "structured", label: "It feels focused and structured — clear roles, defined goals, and everyone knows what they're responsible for" },
      { value: "trust_based", label: "It feels flexible and trust-based — we don't micromanage, we give each other space and check in when needed" },
      { value: "supportive", label: "It feels supportive and safe — I can be honest, make mistakes, and still feel valued by the team" },
    ],
    allowOther: true,
    detailPrompt: "Want to describe your ideal collaboration experience in more detail? (Optional — but helps us match you better)",
  },
  {
    key: "stress_response",
    question: "When a project hits a rough patch — deadlines slip, things break, uncertainty rises — what's your natural first response?",
    type: "hybrid",
    options: [
      { value: "push_through", label: "I push through — I get more focused under pressure and find ways to adapt on the fly" },
      { value: "step_back", label: "I step back to reassess — I need to understand the full picture before deciding how to move forward" },
      { value: "talk_through", label: "I talk it through with the team — I process best by discussing and hearing different perspectives" },
      { value: "take_space", label: "I need a moment to decompress first — I process internally before I can respond constructively" },
    ],
    allowOther: true,
  },
  {
    key: "recognition_style",
    question: "When the team wins together, how do you naturally want to celebrate or acknowledge that success?",
    type: "hybrid",
    options: [
      { value: "equal", label: "Spotlight on everyone equally — every person's contribution matters and should be acknowledged" },
      { value: "work_speaks", label: "Let the work speak for itself — I don't need external recognition, the outcome is enough" },
      { value: "specific", label: "Acknowledge each person's specific contribution — I like calling out what exactly each person brought" },
      { value: "celebrate", label: "I love celebrating properly — team dinners, shoutouts, making people feel genuinely appreciated" },
    ],
    allowOther: true,
  },
  {
    key: "step_back_reason",
    question: "What would make you step back from a collaboration — even if everything looked fine on the surface?",
    type: "freetext",
  },
  {
    key: "communication_style",
    question: "What's your ideal communication rhythm with someone you work closely with?",
    type: "hybrid",
    options: [
      { value: "daily", label: "Daily sync — even a quick 10-minute check-in keeps us aligned and prevents things from drifting" },
      { value: "few_times_week", label: "A few times a week — enough to stay connected, but not so much that it disrupts deep work" },
      { value: "async", label: "Async-first — I prefer written updates, voice notes, or shared docs over scheduled meetings" },
      { value: "on_demand", label: "On-demand only — reach out when there's something meaningful to discuss, not on a fixed schedule" },
    ],
    allowOther: true,
  },
];

const cofounderQuestions: Question[] = [
  {
    key: "vision_flexibility",
    question: "If the company needed to pivot completely away from the original idea, how would you approach that decision?",
    type: "hybrid",
    options: [
      { value: "embrace", label: "I'd embrace it if the data supports it — I'm building a company, not married to one idea" },
      { value: "depends", label: "It depends on how far we've come — if we've invested years, I'd need a very strong case for change" },
      { value: "convincing", label: "I'd need strong convincing — I believe in staying the course and not chasing every new signal" },
      { value: "discuss", label: "I'd want us to explore it together deeply — no snap decisions, but no ignoring the evidence either" },
    ],
    allowOther: true,
    detailPrompt: "Have you ever been through a pivot? What was that like? (Optional)",
  },
  {
    key: "equity_expectations",
    question: "How do you think about equity — not just the percentage, but what fairness genuinely means in a co-founding relationship?",
    type: "hybrid",
    options: [
      { value: "equal", label: "Equal split — we're in this together from day one, and equal ownership reflects that commitment" },
      { value: "contribution", label: "Based on contribution over time — equity should reflect who's actually putting in the work consistently" },
      { value: "risk", label: "Based on who takes the most risk — whoever is sacrificing more (financially, career-wise) should be compensated" },
      { value: "dynamic", label: "It should be dynamic — start with an initial split and revisit as roles and contributions evolve" },
    ],
    allowOther: true,
  },
  {
    key: "decision_structure",
    question: "When you and a co-founder strongly disagree on a critical decision, how do you believe it should be resolved?",
    type: "hybrid",
    options: [
      { value: "domain_owner", label: "Whoever owns that domain gets the final call — we each have areas of expertise and should trust that" },
      { value: "discuss", label: "We discuss until we genuinely align — I won't move forward unless we're both truly on board" },
      { value: "third_perspective", label: "Bring in a third perspective — an advisor, mentor, or board member to help us see what we might be missing" },
      { value: "data", label: "Let the data decide — run a test, talk to users, gather evidence before committing either way" },
    ],
    allowOther: true,
  },
  {
    key: "financial_runway",
    question: "What is your current financial runway — how long can you sustain yourself while building without a salary?",
    type: "hybrid",
    options: [
      { value: "less_3m", label: "Less than 3 months — I need to figure out income soon, which affects how much risk I can take" },
      { value: "3_6m", label: "3 to 6 months — enough to get started, but I'll need the company to generate revenue or raise funding" },
      { value: "6_12m", label: "6 to 12 months — I've planned for this and can stay focused without immediate financial pressure" },
      { value: "more_1y", label: "More than a year — I'm financially prepared to commit long-term without worrying about personal expenses" },
    ],
    allowOther: true,
  },
  {
    key: "long_term_vision",
    question: "If the company succeeded beyond what you imagined — what role would you want to play? What would your life look like?",
    type: "freetext",
  },
  {
    key: "past_collaboration",
    question: "Have you had a co-founding or deep collaboration not work out before? What did you learn about yourself from that experience?",
    type: "freetext",
  },
  {
    key: "commitment_consistency",
    question: "How do you handle it when one co-founder's personal life creates an uneven workload for a period?",
    type: "hybrid",
    options: [
      { value: "cover", label: "I'd give them space and cover — life happens, and I'd want the same support in return" },
      { value: "discuss", label: "I'd discuss it openly — we should adjust expectations together so resentment doesn't build" },
      { value: "depends", label: "It depends on how long — I can handle a few weeks, but months of imbalance would be a problem" },
      { value: "proactive", label: "I'd want us to have a plan for this before it happens — so we're not figuring it out in the moment" },
    ],
    allowOther: true,
  },
  {
    key: "trust_style",
    question: "How do you build trust with a co-founder — and what would break it?",
    type: "hybrid",
    options: [
      { value: "consistency", label: "Trust builds through consistency — do what you say, show up reliably, follow through on commitments" },
      { value: "vulnerability", label: "Trust builds through vulnerability — being honest about doubts, weaknesses, and fears" },
      { value: "competence", label: "Trust builds through competence — I trust people who are excellent at what they do" },
      { value: "transparency", label: "Trust builds through radical transparency — share everything, even when it's uncomfortable" },
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
    question: "How do you think about the boundary between personal life and building something you deeply care about?",
    type: "hybrid",
    options: [
      { value: "blur", label: "I blur the lines intentionally — my work is my life's work, and I don't see them as separate" },
      { value: "protect", label: "I protect personal time deliberately — I'm more effective when I have space to recharge and live fully" },
      { value: "seasonal", label: "It shifts by season — during launches or crises I go all-in, then I pull back to recover" },
      { value: "boundaries", label: "I set firm boundaries — I've learned the hard way that burnout helps no one" },
    ],
    allowOther: true,
  },
  {
    key: "non_negotiables",
    question: "Is there anything you would absolutely not compromise on in a co-founding relationship? Be specific.",
    type: "freetext",
  },
  {
    key: "mission_priority",
    question: "What does loyalty to a shared mission mean to you — especially when a better personal opportunity appears?",
    type: "hybrid",
    options: [
      { value: "mission_first", label: "The mission comes first — I committed, and I follow through even when something shinier shows up" },
      { value: "coexist", label: "Personal growth and mission can coexist — I'd explore whether both can be served before choosing" },
      { value: "stage_dependent", label: "It depends on the stage — early on, I'm all-in; later, it's fair to re-evaluate as things evolve" },
      { value: "honest_conversation", label: "I'd have an honest conversation — hiding that I'm considering something else would be worse than discussing it" },
    ],
    allowOther: true,
    detailPrompt: "Have you faced this situation before? What happened? (Optional)",
  },
];

const teammateQuestions: Question[] = [
  {
    key: "ownership_style",
    question: "Do you prefer to own a specific area deeply, or contribute across different areas of the project?",
    type: "hybrid",
    options: [
      { value: "deep", label: "I prefer owning a domain deeply — I do my best work when I can go deep and become the expert in my area" },
      { value: "broad", label: "I like contributing broadly — variety keeps me engaged, and I enjoy connecting dots across domains" },
      { value: "mix", label: "A mix of both — I want a primary focus but enjoy occasionally stepping into other areas when needed" },
    ],
    allowOther: true,
  },
  {
    key: "feedback_style",
    question: "How do you respond when someone gives you candid, critical feedback on your work?",
    type: "hybrid",
    options: [
      { value: "welcome", label: "I welcome it genuinely — direct feedback is how I grow, and I'd rather hear the hard truth than polite vagueness" },
      { value: "context", label: "I need context first — I receive feedback better when I understand the reasoning and intent behind it" },
      { value: "written", label: "I prefer written feedback — it gives me time to process without reacting emotionally in the moment" },
      { value: "relationship", label: "It depends on the relationship — I take feedback best from people I trust and respect" },
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
      { value: "collaborative", label: "Collaborative and flat — I do best in teams where everyone's voice carries equal weight" },
      { value: "mentoring", label: "Mentoring and growth-focused — I want a leader who invests in my development, not just deliverables" },
    ],
    allowOther: true,
  },
  {
    key: "autonomy_level",
    question: "How important is understanding the 'why' behind what you're building?",
    type: "hybrid",
    options: [
      { value: "very", label: "Very important — I need to believe in the purpose; I can't just execute without understanding the bigger picture" },
      { value: "helpful", label: "Helpful but not essential — I appreciate context, but I can deliver great work either way" },
      { value: "execution", label: "I focus on excellent execution — tell me what needs to be done, and I'll make it exceptional" },
    ],
    allowOther: true,
  },
  {
    key: "adaptability",
    question: "How do you handle it when priorities shift suddenly and your current work gets deprioritised?",
    type: "hybrid",
    options: [
      { value: "adapt", label: "I adapt quickly — I understand that things change, and I can switch gears without losing momentum" },
      { value: "recalibrate", label: "I need a moment to recalibrate — a brief pause to reorganise my thoughts and adjust my plan" },
      { value: "understand", label: "I need to understand why first — context helps me buy in; without it, I feel directionless" },
      { value: "frustrated", label: "Honestly, it frustrates me — I invest deeply in my work and constant shifting makes it hard to deliver quality" },
    ],
    allowOther: true,
  },
  {
    key: "motivation_style",
    question: "What genuinely motivates you to do your best work — beyond just the paycheck?",
    type: "hybrid",
    options: [
      { value: "impact", label: "Seeing real impact — knowing my work genuinely helped someone or moved something meaningful forward" },
      { value: "mastery", label: "Mastery and growth — the feeling of getting significantly better at something I care about" },
      { value: "recognition", label: "Recognition from people I respect — a genuine 'this was excellent' goes a long way for me" },
      { value: "autonomy", label: "Autonomy and creative freedom — being trusted to solve problems my own way" },
    ],
    allowOther: true,
  },
  {
    key: "conflict_style",
    question: "When a conflict arises with a teammate, how do you naturally prefer to address it?",
    type: "hybrid",
    options: [
      { value: "directly", label: "Directly and immediately — I believe in addressing things head-on before they grow into bigger issues" },
      { value: "calmly", label: "Calmly when both sides are ready — I wait until emotions settle so we can have a productive conversation" },
      { value: "gradually", label: "Gradually over time — I tend to work through it in smaller, natural moments rather than one big talk" },
      { value: "mediator", label: "Through a neutral third party — sometimes having someone else facilitate makes the conversation safer" },
    ],
    allowOther: true,
  },
  {
    key: "commitment_type",
    question: "What type of commitment are you looking for right now?",
    type: "hybrid",
    options: [
      { value: "ft", label: "Long-term full-time — I want to fully commit and grow with a team over years" },
      { value: "pt", label: "Long-term part-time — I want ongoing involvement but have other commitments to balance" },
      { value: "project", label: "Project-based — I prefer defined engagements with clear start and end dates" },
      { value: "open", label: "Open to either — the right opportunity matters more than the structure" },
    ],
    allowOther: true,
  },
  {
    key: "ideal_environment",
    question: "Describe the team dynamic that has brought out your absolute best work. What made it special?",
    type: "freetext",
  },
  {
    key: "startup_readiness",
    question: "How comfortable are you in early-stage environments where processes are still being figured out?",
    type: "hybrid",
    options: [
      { value: "very", label: "Very comfortable — I thrive in ambiguity and actually enjoy building systems from scratch" },
      { value: "somewhat", label: "Somewhat comfortable — I can handle it but I'm more productive once some basics are in place" },
      { value: "structure", label: "I prefer more structure — I do my best work when there are established processes and clear expectations" },
    ],
    allowOther: true,
  },
  {
    key: "dealbreakers",
    question: "What would make you leave a team — even if you genuinely liked the people and believed in the mission?",
    type: "freetext",
  },
  {
    key: "assertiveness",
    question: "How do you balance being a strong team player with advocating for your own ideas and perspectives?",
    type: "hybrid",
    options: [
      { value: "collaborative", label: "I advocate firmly but collaboratively — I share my perspective strongly and genuinely listen to others" },
      { value: "go_with_team", label: "I tend to go with the team — harmony matters to me, and I trust the group's collective wisdom" },
      { value: "lead", label: "I lead with my ideas and adjust — I'm naturally opinionated but willing to change my mind with evidence" },
      { value: "context", label: "It depends on the context — on topics I know well I push hard, on others I defer to expertise" },
    ],
    allowOther: true,
  },
];

const clientQuestions: Question[] = [
  {
    key: "involvement_pref",
    question: "How involved do you want to be in the day-to-day execution of work you commission?",
    type: "hybrid",
    options: [
      { value: "very", label: "Very involved — I like being in the details, reviewing work regularly, and shaping direction closely" },
      { value: "milestones", label: "At key milestones — I want meaningful check-ins at important stages but don't need to see every step" },
      { value: "hands_off", label: "Hands-off — I trust the people I hire and prefer to see results rather than manage the process" },
    ],
    allowOther: true,
  },
  {
    key: "communication_rhythm",
    question: "How do you prefer to stay connected with a partner or team working on your project?",
    type: "hybrid",
    options: [
      { value: "daily", label: "Daily check-ins — even brief updates keep me confident that things are moving in the right direction" },
      { value: "weekly", label: "Weekly updates — a structured summary each week is the right balance of visibility and efficiency" },
      { value: "async", label: "Async updates — shared documents, recorded updates, or dashboards I can check when I have time" },
      { value: "on_demand", label: "On-demand only — reach out when there's a decision needed or a blocker, otherwise keep building" },
    ],
    allowOther: true,
  },
  {
    key: "relationship_style",
    question: "What does a truly successful working relationship with an external partner look like to you? Describe your ideal experience.",
    type: "freetext",
  },
  {
    key: "feedback_style",
    question: "How do you handle it when a deliverable doesn't meet your expectations the first time?",
    type: "hybrid",
    options: [
      { value: "iterate", label: "I give clear, specific feedback and expect quick iteration — it's normal and part of the process" },
      { value: "understand", label: "I want to understand what went wrong first — was it a miscommunication, or a capability issue?" },
      { value: "depends", label: "It depends on how far off it is — small misses are fine, but a complete miss raises concerns" },
      { value: "disappointed", label: "Honestly, I'd be disappointed — I invest time in briefing and expect that investment to be honoured" },
    ],
    allowOther: true,
  },
  {
    key: "decision_speed",
    question: "How quickly do you typically move when making decisions about projects or partnerships?",
    type: "hybrid",
    options: [
      { value: "fast", label: "Fast — I trust my instincts and prefer to course-correct rather than over-analyse upfront" },
      { value: "moderate", label: "Moderate — I take a few days to consider options, consult relevant people, then commit fully" },
      { value: "careful", label: "Careful — I need time, data, and sometimes external input before I'm comfortable deciding" },
    ],
    allowOther: true,
  },
  {
    key: "scope_clarity",
    question: "How defined is your brief or project scope usually when you bring someone in?",
    type: "hybrid",
    options: [
      { value: "mapped", label: "Fully mapped out — I know exactly what I want and need someone who can execute against a clear plan" },
      { value: "directional", label: "Directional — I have a strong sense of where we're going but I'm open to shaping the approach together" },
      { value: "open", label: "Very open — I rely on the partner's expertise to help define the scope and approach from the start" },
    ],
    allowOther: true,
  },
  {
    key: "budget_philosophy",
    question: "When investing in a collaboration, what's most important to you? Select all that apply.",
    type: "multi",
    options: [
      { value: "speed", label: "Speed to delivery — getting to market or results quickly is worth paying a premium for" },
      { value: "quality", label: "Quality of output — I'd rather wait longer and pay more for work that's genuinely excellent" },
      { value: "value", label: "Value for investment — I want to feel confident that every dollar spent is generating meaningful return" },
      { value: "relationship", label: "Long-term relationship — I'm looking for a partner I can work with repeatedly, not a one-off vendor" },
    ],
    allowOther: true,
  },
  {
    key: "past_collab_exp",
    question: "Have you worked with an external team or freelancer before? What worked well and what didn't?",
    type: "freetext",
  },
  {
    key: "trust_style",
    question: "How comfortable are you giving creative or strategic autonomy to people you bring in?",
    type: "hybrid",
    options: [
      { value: "very", label: "Very comfortable — I hire smart people specifically so they can bring perspectives I wouldn't have thought of" },
      { value: "somewhat", label: "Somewhat — I'm open to their ideas but want regular check-ins to make sure we're aligned" },
      { value: "close", label: "I stay closely involved — I have a clear vision and need the work to align precisely with that" },
    ],
    allowOther: true,
  },
  {
    key: "timeline_style",
    question: "How do you think about timelines and deadlines for projects?",
    type: "hybrid",
    options: [
      { value: "firm", label: "Firm deadlines — I plan around them and expect them to be met; delays have real consequences" },
      { value: "flexible", label: "Flexible milestones — I set targets but understand that quality work sometimes needs more time" },
      { value: "outcome", label: "Outcome-focused — I care more about the result being right than hitting an arbitrary date" },
    ],
    allowOther: true,
  },
  {
    key: "adaptability",
    question: "How would you approach it if a project needed significantly more time or budget than originally planned?",
    type: "hybrid",
    options: [
      { value: "adjust", label: "Reassess and adjust together — if the reasons are valid, I'm willing to invest more to get it right" },
      { value: "depends", label: "It depends on the reason — if it's a genuine discovery, fine; if it's poor planning, that's a problem" },
      { value: "justify", label: "I'd need strong justification — I set budgets and timelines deliberately and expect them to be respected" },
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
