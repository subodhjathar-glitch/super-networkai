import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account.");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        // Check onboarding completion before deciding where to navigate
        const { data: { user: loggedInUser } } = await supabase.auth.getUser();
        if (loggedInUser) {
          const [identityRes, profileRes, ikigaiRes, personalityRes] = await Promise.all([
            supabase.from("user_identity").select("identity_type, intent_types").eq("user_id", loggedInUser.id).maybeSingle(),
            supabase.from("profiles").select("name, core_skills, cv_url, location_country, location_city, industries").eq("user_id", loggedInUser.id).maybeSingle(),
            supabase.from("ikigai").select("love_text, good_at_text, world_needs_text, livelihood_text").eq("user_id", loggedInUser.id).maybeSingle(),
            supabase.from("personality").select("working_style, stress_response, communication_style").eq("user_id", loggedInUser.id).maybeSingle(),
          ]);

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

          if (hasIdentity && hasProfile && hasIkigai && hasPersonality) {
            navigate("/search");
          } else {
            navigate("/onboarding");
          }
        } else {
          navigate("/onboarding");
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            SuperNetworkAI
          </h1>
          <p className="text-muted-foreground">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex mb-6 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12 text-base"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
