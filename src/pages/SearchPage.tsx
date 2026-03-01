import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import MatchCard from "@/components/MatchCard";

const placeholders = [
  "A technical co-founder who values impact over status...",
  "Someone who cares deeply about health tech and won't walk away...",
  "A UX designer looking for creative ownership in fintech...",
];

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const callAiSearch = async (step: string, body: any) => {
    const token = await getToken();
    if (!token) {
      toast.error("Please sign in first.");
      navigate("/auth");
      return null;
    }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ step, ...body }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      if (res.status === 429) {
        toast.error("Rate limited. Please wait a moment and try again.");
      } else if (res.status === 402) {
        toast.error("Usage limit reached. Please add credits.");
      } else {
        toast.error(err.error || "Search failed. Please try again.");
      }
      return null;
    }

    return res.json();
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    setShowResults(false);
    setMatches([]);
    setFollowUp("");
    setFollowUpAnswer("");

    const result = await callAiSearch("follow-up", { query: query.trim() });
    setLoading(false);

    if (result) {
      setFollowUp(result.followUp || "What's most important to you in this collaboration?");
      setSearched(true);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpAnswer.trim()) return;
    setLoading(true);

    const result = await callAiSearch("search", {
      query: query.trim(),
      followUpAnswer: followUpAnswer.trim(),
    });
    setLoading(false);

    if (result) {
      setMatches(result.matches || []);
      setShowResults(true);
    }
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
          <Button variant="outline" size="sm" onClick={() => navigate("/connections")}>
            Connections
          </Button>
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
              disabled={loading}
            />
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 gradient-hero text-primary-foreground border-0 hover:opacity-90"
            >
              {loading && !searched ? "..." : "Search"}
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
                      disabled={loading}
                    />
                    <Button
                      onClick={handleFollowUp}
                      variant="outline"
                      disabled={!followUpAnswer.trim() || loading}
                    >
                      {loading ? "..." : "Answer"}
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
                {matches.length} matches found — ranked by compatibility and sustainability
              </p>
              {matches.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No matches found yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    More people need to complete their profiles for matching to work.
                  </p>
                </div>
              )}
              {matches.map((match, i) => (
                <motion.div
                  key={match.name + i}
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
