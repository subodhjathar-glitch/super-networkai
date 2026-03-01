import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import IdentityStep from "@/components/onboarding/IdentityStep";
import type { ProfileData } from "@/components/onboarding/ProfileStep";
import ProfileStep from "@/components/onboarding/ProfileStep";
import IkigaiStep from "@/components/onboarding/IkigaiStep";
import AssessmentStep from "@/components/onboarding/AssessmentStep";
import {
  saveIdentity,
  saveProfile,
  saveIkigai,
  savePersonality,
  triggerEmbeddingGeneration,
} from "@/lib/onboarding-persist";

const STEPS = ["Identity", "Profile", "Ikigai", "Assessment"];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
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

  const next = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Save current step data before advancing
      if (step === 0) {
        await saveIdentity(user.id, data.identity, [data.intent]);
      } else if (step === 1) {
        await saveProfile(user.id, data.profile);
      } else if (step === 2) {
        await saveIkigai(user.id, data.ikigai);
      } else if (step === 3) {
        await savePersonality(user.id, data.assessmentAnswers);
        // Final step: trigger embedding generation and navigate
        triggerEmbeddingGeneration().catch(console.error);
        toast.success("Profile complete! Finding your matches...");
        navigate("/search");
        return;
      }

      setStep(step + 1);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
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

      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-6 shadow-elevated text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-foreground font-medium">Saving...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
