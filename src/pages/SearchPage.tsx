import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageCircle, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MatchCard from "@/components/MatchCard";

const placeholders = [
  "A technical co-founder who values impact over status...",
  "Someone who cares deeply about health tech and won't walk away...",
  "A UX designer looking for creative ownership in fintech...",
];

const mockMatches = [
  {
    name: "Priya Sharma",
    role: "Founder · Health Tech",
    location: "Mumbai, India",
    compatibility: 87,
    sustainability: 72,
    summary: "Priya brings deep technical expertise in health tech with a mission-first mindset. Her commitment to long-term impact aligns strongly with your vision.",
    strengths: ["Technical depth", "Mission alignment", "Health tech domain"],
    risks: [
      { type: "Commitment Pace", severity: "Medium" as const, explanation: "Priya's preferred timeline is flexible, while your search suggests a need for full-time urgency — worth discussing early." },
      { type: "Decision Style", severity: "Low" as const, explanation: "You both prefer collaborative decisions, though you lean slightly more directive under pressure." },
    ],
    starters: [
      "How do you each envision the first 6 months of working together?",
      "What does 'full commitment' look like in your day-to-day life right now?",
      "How would you handle a situation where the product needs to pivot significantly?",
    ],
  },
  {
    name: "Alex Chen",
    role: "Founder · AI/ML",
    location: "San Francisco, USA",
    compatibility: 82,
    sustainability: 88,
    summary: "Alex is a resilient builder with strong alignment on recognition sharing and conflict resolution. A partnership with strong long-term health indicators.",
    strengths: ["Resilience", "Value alignment", "AI expertise"],
    risks: [
      { type: "Industry Focus", severity: "Low" as const, explanation: "Alex's experience is primarily in AI/ML infrastructure — may benefit from alignment on health tech specifics." },
    ],
    starters: [
      "What drew you to the intersection of AI and healthcare?",
      "How do you balance technical ambition with user-centred design?",
      "What's your approach to equity and financial fairness in a co-founding relationship?",
    ],
  },
  {
    name: "Sarah Okafor",
    role: "Professional · Product Design",
    location: "Lagos, Nigeria",
    compatibility: 79,
    sustainability: 65,
    summary: "Sarah's product design skills and passion for social impact make her a compelling match, though communication rhythm and commitment expectations may need alignment.",
    strengths: ["Design excellence", "Social impact focus", "Cross-cultural perspective"],
    risks: [
      { type: "Mission Priority", severity: "High" as const, explanation: "Sarah's assessment suggests she may prioritise personal creative goals alongside team mission — worth exploring how she balances both." },
      { type: "Communication Rhythm", severity: "Medium" as const, explanation: "Your preferred daily check-ins differ from Sarah's preference for weekly async updates." },
    ],
    starters: [
      "How do you balance personal creative projects with team commitments?",
      "What does your ideal communication flow look like day-to-day?",
      "When have you felt most fulfilled working as part of a team?",
    ],
  },
];

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearched(true);
    setFollowUp("Are you looking for someone who can commit full-time, or would part-time work too?");
  };

  const handleFollowUp = () => {
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">SuperNetworkAI</span>
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-display font-800 text-foreground mb-3">
              Find your people
            </h1>
            <p className="text-muted-foreground text-lg">
              Describe who you're looking for in your own words.
            </p>
          </motion.div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={placeholders[0]}
              className="h-14 pl-12 pr-28 text-base rounded-xl shadow-card border-border"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 gradient-hero text-primary-foreground border-0 hover:opacity-90"
            >
              Search
            </Button>
          </div>

          {/* Follow-up */}
          {searched && !showResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border mb-8"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-foreground font-medium">{followUp}</p>
                  <div className="flex gap-2">
                    <Input
                      value={followUpAnswer}
                      onChange={(e) => setFollowUpAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
                      placeholder="Type your answer..."
                      className="flex-1"
                    />
                    <Button onClick={handleFollowUp} variant="outline" disabled={!followUpAnswer.trim()}>
                      Answer
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {showResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <p className="text-sm text-muted-foreground">
                {mockMatches.length} matches found — ranked by compatibility and sustainability
              </p>
              {mockMatches.map((match, i) => (
                <motion.div
                  key={match.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <MatchCard match={match} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
