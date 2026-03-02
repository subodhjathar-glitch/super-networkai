import { Button } from "@/components/ui/button";
import { Rocket, Briefcase, Building2, Users, UserPlus, Handshake, Layers } from "lucide-react";

interface Props {
  identity: string;
  intent: string;
  onChange: (identity: string, intent: string) => void;
  onNext: () => void;
}

const identities = [
  { value: "founder", label: "Founder", desc: "Building or leading a startup", icon: Rocket },
  { value: "professional", label: "Professional", desc: "Skilled individual open to teams", icon: Briefcase },
  { value: "organisation", label: "Organisation", desc: "A business seeking collaborators", icon: Building2 },
];

// Intent options per identity type — PRD: Co-founder is ONLY available to Founders
const intentsByIdentity: Record<string, { value: string; label: string; desc: string; icon: typeof UserPlus }[]> = {
  founder: [
    { value: "cofounder", label: "A Co-founder", desc: "Someone to build with at founding level", icon: UserPlus },
    { value: "teammates", label: "Teammates", desc: "Skilled people to join the team", icon: Users },
    { value: "clients", label: "Clients", desc: "People who need my services", icon: Handshake },
    { value: "all", label: "All of the above", desc: "Co-founders, teammates, and clients — open to all", icon: Layers },
  ],
  professional: [
    { value: "teammates", label: "Teammates", desc: "Teams and projects to join and contribute to", icon: Users },
    { value: "clients", label: "Clients", desc: "People who need my services", icon: Handshake },
    { value: "all", label: "Open to opportunities", desc: "Teammates and clients — open to any meaningful collaboration", icon: Layers },
  ],
  organisation: [
    { value: "teammates", label: "Teammates", desc: "Skilled people to join the team", icon: Users },
    { value: "clients", label: "Clients", desc: "Partners who need our services", icon: Handshake },
    { value: "all", label: "Open to partnerships", desc: "Teammates and clients — open to any meaningful collaboration", icon: Layers },
  ],
};

const IdentityStep = ({ identity, intent, onChange, onNext }: Props) => {
  const availableIntents = identity ? (intentsByIdentity[identity] || []) : [];

  const handleIdentityChange = (newIdentity: string) => {
    // If the current intent is not valid for the new identity, reset it
    const newIntents = intentsByIdentity[newIdentity] || [];
    const intentStillValid = newIntents.some((i) => i.value === intent);
    onChange(newIdentity, intentStillValid ? intent : "");
  };

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-display font-800 text-foreground mb-2">
          Tell us a little about yourself
        </h1>
        <p className="text-muted-foreground text-lg">
          and what brings you here.
        </p>
      </div>

      {/* I am a... */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">I am a...</label>
        <div className="grid gap-3">
          {identities.map((item) => (
            <button
              key={item.value}
              onClick={() => handleIdentityChange(item.value)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                ${identity === item.value
                  ? "border-accent bg-accent/5 shadow-glow"
                  : "border-border bg-card hover:border-muted-foreground/30"
                }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                ${identity === item.value ? "gradient-hero" : "bg-secondary"}`}>
                <item.icon className={`w-5 h-5 ${identity === item.value ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="font-semibold text-foreground">{item.label}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* I am here to find... — only shown after identity is selected */}
      {identity && (
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">I am here to find...</label>
          <div className="grid grid-cols-2 gap-3">
            {availableIntents.map((item) => (
              <button
                key={item.value}
                onClick={() => onChange(identity, item.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                  ${intent === item.value
                    ? "border-accent bg-accent/5 shadow-glow"
                    : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${intent === item.value ? "text-accent" : "text-muted-foreground"}`} />
                <div className="font-semibold text-sm text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={onNext}
        disabled={!identity || !intent}
        className="w-full gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12 text-base"
      >
        Continue
      </Button>
    </div>
  );
};

export default IdentityStep;
