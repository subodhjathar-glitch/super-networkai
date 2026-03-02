import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, LogOut, MapPin, ChevronDown, X, Briefcase, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COUNTRIES, INDUSTRIES, SKILLS } from "@/components/onboarding/constants";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import MatchCard from "@/components/MatchCard";

/* ── Scrollable multi-select picker (inline) ── */
const FilterPicker = ({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
  placeholder = "Any",
  multi = true,
}: {
  label: string;
  icon: React.ElementType;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  multi?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const toggle = (val: string) => {
    if (multi) {
      onChange(
        selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]
      );
    } else {
      onChange(selected.includes(val) ? [] : [val]);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {label}
      </label>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/20"
            >
              {s}
              <X
                className="w-3 h-3 cursor-pointer hover:text-foreground"
                onClick={() => toggle(s)}
              />
            </span>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 w-full justify-between text-sm">
            {selected.length > 0 ? `${selected.length} selected` : placeholder}
            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-2" align="start">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="h-8 text-sm mb-2"
          />
          <ScrollArea className="h-[200px]">
            {filtered.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggle(option)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                    isSelected ? "bg-accent/10 text-accent font-medium" : "hover:bg-secondary"
                  }`}
                >
                  {option}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">No results</p>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const SearchPage = () => {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [prefCountry, setPrefCountry] = useState("");
  const [prefCity, setPrefCity] = useState("");
  const [freeText, setFreeText] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [noMatchReason, setNoMatchReason] = useState("");
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      const [identityRes, profileRes, ikigaiRes, personalityRes] = await Promise.all([
        supabase.from("user_identity").select("id, identity_type, intent_types").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("name, core_skills, industries, cv_url, location_country, location_city").eq("user_id", user.id).maybeSingle(),
        supabase.from("ikigai").select("love_text, good_at_text, world_needs_text, livelihood_text").eq("user_id", user.id).maybeSingle(),
        supabase.from("personality").select("working_style, stress_response, communication_style").eq("user_id", user.id).maybeSingle(),
      ]);

      const name = profileRes.data?.name?.trim() || user.email?.split("@")[0] || "there";
      setProfileName(name);

      const hasIdentity = !!(identityRes.data?.identity_type && identityRes.data?.intent_types?.length);
      const hasProfile = !!(
        profileRes.data?.name?.trim() &&
        (profileRes.data?.location_country || profileRes.data?.location_city) &&
        (profileRes.data?.industries?.length > 0) &&
        (profileRes.data?.core_skills?.length > 0) &&
        profileRes.data?.cv_url
      );
      const hasIkigai = !!(
        ikigaiRes.data?.love_text?.trim() &&
        ikigaiRes.data?.good_at_text?.trim() &&
        ikigaiRes.data?.world_needs_text?.trim() &&
        ikigaiRes.data?.livelihood_text?.trim()
      );
      const hasPersonality = !!(
        personalityRes.data?.working_style &&
        personalityRes.data?.stress_response &&
        personalityRes.data?.communication_style
      );

      if (!hasIdentity || !hasProfile || !hasIkigai || !hasPersonality) {
        toast.info("Please complete your profile to start searching.");
        navigate("/onboarding", { replace: true });
      } else {
        setCheckingOnboarding(false);
      }
    };

    check();
  }, [user, navigate]);

  const hasFilters = selectedIndustries.length > 0 || selectedSkills.length > 0 || prefCountry || prefCity.trim() || freeText.trim();

  const handleSearch = async () => {
    if (!hasFilters) {
      toast.error("Please select at least one filter.");
      return;
    }

    setLoading(true);
    setSearched(false);
    setMatches([]);
    setNoMatchReason("");

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      toast.error("Please sign in first.");
      navigate("/auth");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step: "search",
            filterIndustries: selectedIndustries,
            filterSkills: selectedSkills,
            prefCountry,
            prefCity: prefCity.trim(),
            freeText: freeText.trim(),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        if (res.status === 429) toast.error("Rate limited. Please wait a moment.");
        else if (res.status === 402) toast.error("Usage limit reached. Please add credits.");
        else toast.error(err.error || "Search failed.");
        setLoading(false);
        return;
      }

      const result = await res.json();
      setMatches(result.matches || []);
      setNoMatchReason(result.noMatchReason || "");
      setSearched(true);
    } catch {
      toast.error("Search failed. Please try again.");
    }

    setLoading(false);
  };

  const clearAll = () => {
    setSelectedIndustries([]);
    setSelectedSkills([]);
    setPrefCountry("");
    setPrefCity("");
    setFreeText("");
    setMatches([]);
    setSearched(false);
    setNoMatchReason("");
  };

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Hi, {profileName || "there"}</span>
            <Button variant="outline" size="sm" onClick={() => navigate("/onboarding")}>
              Edit Profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/connections")}>
              Connections
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
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
              Select the industry, skills, and location you're looking for.
            </p>
          </motion.div>

          {/* Structured Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 shadow-card border border-border mb-8 space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Industry */}
              <FilterPicker
                label="Industry"
                icon={Briefcase}
                options={INDUSTRIES}
                selected={selectedIndustries}
                onChange={setSelectedIndustries}
                placeholder="Select industries..."
              />

              {/* Skills / Role */}
              <FilterPicker
                label="Skills & Roles"
                icon={Wrench}
                options={SKILLS}
                selected={selectedSkills}
                onChange={setSelectedSkills}
                placeholder="Select skills..."
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Location
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 w-full justify-between text-sm">
                      {prefCountry || "Any country"}
                      <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-2" align="start">
                    <Input
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search country..."
                      className="h-8 text-sm mb-2"
                    />
                    <ScrollArea className="h-[200px]">
                      <button
                        onClick={() => { setPrefCountry(""); setCountryOpen(false); setCountrySearch(""); }}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${!prefCountry ? "bg-accent/10 text-accent" : "hover:bg-secondary"}`}
                      >
                        Any country
                      </button>
                      {COUNTRIES.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase())).map((c) => (
                        <button
                          key={c}
                          onClick={() => { setPrefCountry(c); setCountryOpen(false); setCountrySearch(""); }}
                          className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${prefCountry === c ? "bg-accent/10 text-accent" : "hover:bg-secondary"}`}
                        >
                          {c}
                        </button>
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                <Input
                  value={prefCity}
                  onChange={(e) => setPrefCity(e.target.value)}
                  placeholder="Any city"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Optional free-text */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Search className="w-4 h-4 text-muted-foreground" />
                Additional context <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="E.g. 'Looking for someone passionate about climate tech with startup experience'"
                className="h-10 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                onClick={handleSearch}
                disabled={loading || !hasFilters}
                className="flex-1 gradient-hero text-primary-foreground border-0 hover:opacity-90 h-11 text-base"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
              {hasFilters && (
                <Button variant="outline" onClick={clearAll} className="h-11">
                  Clear all
                </Button>
              )}
            </div>
          </motion.div>

          {/* Results */}
          {searched && (
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
                  <p className="text-muted-foreground text-lg">No exact matches found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {noMatchReason || "Try broadening your filters or selecting different industries/skills."}
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
