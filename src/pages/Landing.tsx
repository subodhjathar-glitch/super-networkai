import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Landing = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <span className="font-sans font-bold text-base tracking-tight text-foreground">
            SuperNetwork<span className="text-primary">AI</span>
          </span>
          <Button
            size="sm"
            onClick={() => navigate("/search")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 text-sm font-sans font-semibold"
          >
            Get Started
          </Button>
          {user && (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => { await signOut(); navigate("/"); }}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Log out
            </Button>
          )}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.p
            className="text-primary font-sans text-sm font-semibold tracking-[0.2em] uppercase mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            AI-Powered Networking
          </motion.p>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-display leading-[1.05] mb-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            Connect with people
            <br />
            who <span className="italic text-primary">truly</span> align.
          </motion.h1>

          <motion.p
            className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-12 font-sans"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            SuperNetworkAI connects founders, professionals, and organisations
            — not by surface-level skills, but through deep psychological alignment,
            shared values, and self-discovery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/search")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 h-14 text-base font-sans font-semibold"
            >
              Start your journey
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/search")}
              className="rounded-full px-8 h-14 text-base font-sans border-border/60 text-foreground hover:bg-secondary"
            >
              Explore matches
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.5 }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/40 flex items-start justify-center p-1">
            <motion.div
              className="w-1 h-2 rounded-full bg-muted-foreground/60"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
            />
          </div>
        </motion.div>
      </section>

      {/* ─── WHO IS THIS FOR ─── */}
      <section className="py-32 px-4 border-t border-border/50">
        <div className="container max-w-5xl mx-auto">
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary font-sans text-sm font-semibold tracking-[0.15em] uppercase mb-6">Who is this for</p>
            <h2 className="text-3xl md:text-5xl font-display leading-[1.15] max-w-3xl">
              Whether you're building, joining, or hiring
              — <span className="italic">it starts with the right people.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-px bg-border/30 rounded-2xl overflow-hidden">
            {[
              {
                label: "Founders",
                desc: "Looking for a co-founder who shares your commitment, values, and long-term vision — not just complementary skills.",
              },
              {
                label: "Professionals",
                desc: "Seeking a team or project where you genuinely belong — where your working style, values, and ambitions are understood.",
              },
              {
                label: "Organisations",
                desc: "Finding collaborators, contractors, or partners whose communication rhythm and working approach truly fit yours.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-card p-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <h3 className="font-display text-2xl text-foreground mb-4">{item.label}</h3>
                <p className="text-muted-foreground text-sm font-sans leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT MAKES US DIFFERENT ─── */}
      <section className="py-32 px-4 border-t border-border/50">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary font-sans text-sm font-semibold tracking-[0.15em] uppercase mb-6">Why SuperNetworkAI</p>
            <h2 className="text-3xl md:text-5xl font-display leading-[1.15] mb-8 max-w-3xl">
              Every networking platform matches skills.
              <br />
              <span className="italic">None of them match minds.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed font-sans mb-16">
              Most co-founder relationships don't fail because of missing skills.
              They fail because of misaligned values, different commitment levels,
              and conflicting visions. We built something that understands this.
            </p>
          </motion.div>

          <div className="space-y-0">
            {[
              {
                title: "Identity + Intent as the foundation",
                desc: "Every user tells us who they are and what they're seeking. These two dimensions power every layer of matching — from search filters to scoring to AI interpretation.",
              },
              {
                title: "Self-discovery, not just a profile form",
                desc: "A guided, reflective experience that helps you articulate your passions, strengths, purpose, and what you'd build your life around. Your answers become the heart of your matching profile.",
              },
              {
                title: "Deep, role-specific assessment",
                desc: "A conversational AI asks warm, thoughtful questions about your working style, stress responses, decision-making, and vision — tailored to whether you're a founder, professional, or organisation.",
              },
              {
                title: "Dual scoring: compatibility + sustainability",
                desc: "Two scores that tell you not just if someone fits today — but whether your values, commitment, and long-term vision are aligned for the journey ahead.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex gap-6 items-baseline py-8 border-b border-border/40"
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="text-primary/40 font-sans text-sm font-bold tabular-nums shrink-0">0{i + 1}</span>
                <div>
                  <h3 className="font-sans font-semibold text-foreground text-base mb-1.5">{item.title}</h3>
                  <p className="text-muted-foreground text-sm font-sans leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-32 px-4 border-t border-border/50">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary font-sans text-sm font-semibold tracking-[0.15em] uppercase mb-6">How it works</p>
            <h2 className="text-3xl md:text-5xl font-display leading-[1.15]">
              Four steps to people
              <br />
              <span className="italic">you can actually build with.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: "01",
                title: "Tell us who you are",
                desc: "Are you a founder, professional, or organisation? And what are you here to find — a co-founder, teammates, or clients?",
              },
              {
                step: "02",
                title: "Upload your CV & complete your profile",
                desc: "Our AI reads your CV instantly to pre-fill your profile. Add your social links and domain — we handle the rest.",
              },
              {
                step: "03",
                title: "Discover what drives you",
                desc: "A short, guided self-discovery experience maps your passions, strengths, purpose, and values into a living profile.",
              },
              {
                step: "04",
                title: "Search in your own words",
                desc: "Describe what you're looking for naturally. Our AI understands intent, asks smart follow-ups, and returns deeply aligned matches.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-card rounded-2xl p-8 border border-border/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-primary font-sans text-xs font-bold tracking-wider">{item.step}</span>
                <h3 className="font-display text-xl text-foreground mt-3 mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm font-sans leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── USER JOURNEYS ─── */}
      <section className="py-32 px-4 border-t border-border/50">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary font-sans text-sm font-semibold tracking-[0.15em] uppercase mb-6">Real scenarios</p>
            <h2 className="text-3xl md:text-5xl font-display leading-[1.15]">
              See yourself <span className="italic">in the journey.</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                name: "Rahul",
                role: "Founder seeking a co-founder",
                story: "Rahul searches: 'Someone technical who is deeply committed to health tech and won't walk away when things get hard.' The AI asks one follow-up about his commitment level. Then it returns ranked matches — each with a compatibility score, sustainability score, and conversation starters. He sees an insight: 'Mission commitment: worth discussing early.' He feels understood. He connects.",
              },
              {
                name: "Meera",
                role: "UX designer seeking a team",
                story: "Meera searches: 'Early-stage fintech startup that values design and gives creative ownership.' The system asks: 'Full-time or project-based?' She answers. Results appear — ranked by long-term alignment, not just skill match.",
              },
              {
                name: "A growth-stage company",
                role: "Organisation seeking a service partner",
                story: "They search: 'Product design agency with health tech experience.' The system matches them with professionals whose working style, communication rhythm, and scope preferences genuinely align with theirs.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-card rounded-2xl p-8 border border-border/50"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-baseline gap-3 mb-3">
                  <h3 className="font-display text-xl text-foreground">{item.name}</h3>
                  <span className="text-muted-foreground text-xs font-sans">— {item.role}</span>
                </div>
                <p className="text-muted-foreground text-sm font-sans leading-relaxed">{item.story}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 px-4 border-t border-border/50">
        <motion.div
          className="container max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-display leading-[1.1] mb-6">
            The right people exist.
            <br />
            <span className="italic text-primary">Now find them.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-12 font-sans max-w-lg mx-auto">
            Five minutes of honest reflection. A lifetime of meaningful connections.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/search")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-12 h-14 text-base font-sans font-semibold"
          >
            Begin — it's free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container flex items-center justify-between text-xs text-muted-foreground font-sans">
          <span>© 2025 SuperNetworkAI</span>
          <span className="text-muted-foreground/60">Built with Lovable</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
