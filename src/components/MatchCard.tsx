import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, MessageSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Risk {
  type: string;
  severity: "Low" | "Medium" | "High";
  explanation: string;
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
}

const severityColors = {
  Low: "bg-risk-low text-risk-low-foreground",
  Medium: "bg-risk-medium text-risk-medium-foreground",
  High: "bg-risk-high text-risk-high-foreground",
};

const MatchCard = ({ match }: { match: Match }) => {
  const [expanded, setExpanded] = useState(false);

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

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-accent hover:opacity-80 transition-opacity"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Conversation starters
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
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
            <div className="px-6 pb-6 border-t border-border pt-4 space-y-3">
              {match.starters.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground mt-0.5">{i + 1}.</span>
                  <p className="text-sm text-foreground">{s}</p>
                </div>
              ))}
              <button className="w-full mt-3 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Connect with {match.name.split(" ")[0]}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchCard;
