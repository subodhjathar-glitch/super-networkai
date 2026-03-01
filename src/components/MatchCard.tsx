import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, MessageSquare, Sparkles, UserPlus, Check, Loader2, Shield, Flame, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Risk {
  type: string;
  severity: "Low" | "Medium" | "High";
  explanation: string;
}

interface PersonalityAlignment {
  dimension: string;
  match: "good" | "neutral" | "friction";
  detail: string;
}

interface Match {
  name: string;
  role: string;
  location: string;
  compatibility: number;
  sustainability: number;
  summary: string;
  strengths: string[];
  risks: Risk[];
  starters: string[];
  personality_alignment?: PersonalityAlignment[];
  user_id?: string;
}

const severityColors = {
  Low: "bg-risk-low text-risk-low-foreground",
  Medium: "bg-risk-medium text-risk-medium-foreground",
  High: "bg-risk-high text-risk-high-foreground",
};

const MatchCard = ({ match }: { match: Match }) => {
  const [expanded, setExpanded] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  const handleConnect = async () => {
    if (!user || !match.user_id) {
      toast.error("Unable to connect — missing user information.");
      return;
    }
    setConnecting(true);
    try {
      // Check if connection already exists
      const { data: existing } = await supabase
        .from("connections")
        .select("id")
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${match.user_id}),and(requester_id.eq.${match.user_id},recipient_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        toast.info("Connection already exists!");
        setConnected(true);
        return;
      }

      const { error } = await supabase.from("connections").insert({
        requester_id: user.id,
        recipient_id: match.user_id,
        status: "pending",
      });

      if (error) throw error;
      setConnected(true);
      toast.success(`Connection request sent to ${match.name.split(" ")[0]}!`);
    } catch (err: any) {
      console.error("Connect error:", err);
      toast.error("Failed to send connection request.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden hover:shadow-elevated transition-shadow">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg">
              {match.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-display font-700 text-foreground">{match.name}</h3>
              <p className="text-sm text-muted-foreground">{match.role} · {match.location}</p>
            </div>
          </div>

          {/* Scores */}
          <div className="flex gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-accent">{match.compatibility}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Compatibility</div>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className={`text-2xl font-bold ${match.sustainability >= 75 ? "text-success" : match.sustainability >= 60 ? "text-ikigai-good" : "text-ikigai-love"}`}>
                {match.sustainability}%
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Long-term Fit</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-start gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">{match.summary}</p>
        </div>

        {/* Strengths */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {match.strengths.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs font-medium bg-success/10 text-success border-0">
              {s}
            </Badge>
          ))}
        </div>

        {/* Risk Flags */}
        <div className="space-y-2 mb-3">
          {match.risks.map((r) => (
            <div key={r.type} className="flex items-start gap-2">
              <Badge className={`text-xs shrink-0 border-0 ${severityColors[r.severity]}`}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {r.severity}
              </Badge>
              <div>
                <span className="text-sm font-medium text-foreground">{r.type}: </span>
                <span className="text-sm text-muted-foreground">{r.explanation}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-accent hover:opacity-80 transition-opacity"
          >
            <Shield className="w-3.5 h-3.5" />
            View analysis & starters
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          {match.user_id && (
            <button
              onClick={handleConnect}
              disabled={connecting || connected}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${connected
                  ? "bg-success/15 text-success cursor-default"
                  : "gradient-hero text-primary-foreground hover:opacity-90"
                }`}
            >
              {connecting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : connected ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              {connecting ? "Sending..." : connected ? "Requested" : "Connect"}
            </button>
          )}
        </div>
      </div>

      {/* Expandable */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-border pt-4 space-y-5">
              
              {/* Personality Alignment Section (New) */}
              {match.personality_alignment && match.personality_alignment.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <Scale className="w-3.5 h-3.5" /> Personality Alignment
                  </h4>
                  <div className="space-y-2">
                    {match.personality_alignment.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-secondary/30 p-2 rounded-lg">
                        <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 
                          ${item.match === "good" ? "bg-success" : 
                            item.match === "friction" ? "bg-destructive" : "bg-muted-foreground"}`} 
                        />
                        <div className="flex-1">
                          <span className="font-medium text-foreground">{item.dimension}: </span>
                          <span className="text-muted-foreground">{item.detail}</span>
                        </div>
                        {item.match === "good" && <Check className="w-3.5 h-3.5 text-success shrink-0" />}
                        {item.match === "friction" && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Starters Section */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <MessageSquare className="w-3.5 h-3.5" /> Things to discuss
                </h4>
                <div className="space-y-2">
                  {match.starters.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-foreground">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchCard;
