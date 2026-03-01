import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import IdentityStep from "@/components/onboarding/IdentityStep";
import type { ProfileData } from "@/components/onboarding/ProfileStep";
import ProfileStep from "@/components/onboarding/ProfileStep";
import IkigaiStep from "@/components/onboarding/IkigaiStep";
import AssessmentStep from "@/components/onboarding/AssessmentStep";

const STEPS = ["Identity", "Profile", "Ikigai", "Assessment"];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<{
    identity: string;
    intent: string;
    profile: ProfileData;
    ikigai: { love: string; good: string; world: string; livelihood: string };
    assessmentAnswers: Record<string, any>;
  }>({
    identity: "",
    intent: "",
    profile: {
      name: "",
      location_country: "",
      location_city: "",
      industries: [],
      industry_other: "",
      skills: [],
    },
    ikigai: { love: "", good: "", world: "", livelihood: "" },
    assessmentAnswers: {},
  });
  const navigate = useNavigate();

  const updateData = (partial: Partial<typeof data>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else navigate("/search");
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container max-w-3xl mx-auto py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground font-display">
              {STEPS[step]}
            </span>
            <span className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-hero rounded-full"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-24 pb-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <IdentityStep
                  identity={data.identity}
                  intent={data.intent}
                  onChange={(identity, intent) => updateData({ identity, intent })}
                  onNext={next}
                />
              )}
              {step === 1 && (
                <ProfileStep
                  data={data.profile}
                  onChange={(profile) => updateData({ profile })}
                  onNext={next}
                  onBack={back}
                />
              )}
              {step === 2 && (
                <IkigaiStep
                  ikigai={data.ikigai}
                  onChange={(ikigai) => updateData({ ikigai })}
                  onNext={next}
                  onBack={back}
                />
              )}
              {step === 3 && (
                <AssessmentStep
                  identity={data.identity}
                  answers={{ ...data.assessmentAnswers, _intent: data.intent }}
                  onChange={(assessmentAnswers) => {
                    const { _intent, ...rest } = assessmentAnswers;
                    updateData({ assessmentAnswers: rest });
                  }}
                  onNext={next}
                  onBack={back}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
