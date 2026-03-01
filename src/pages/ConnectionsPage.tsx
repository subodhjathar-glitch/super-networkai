import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, Clock, Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
  otherName: string;
  otherInitial: string;
}

const ConnectionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch connections error:", error);
      setLoading(false);
      return;
    }

    // Fetch profile names for the other user
    const otherIds = (data || []).map((c) =>
      c.requester_id === user.id ? c.recipient_id : c.requester_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name")
      .in("user_id", otherIds);

    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p) => {
      nameMap[p.user_id] = p.name || "Unknown";
    });

    const enriched = (data || []).map((c) => {
      const otherId = c.requester_id === user.id ? c.recipient_id : c.requester_id;
      const name = nameMap[otherId] || "Unknown";
      return {
        ...c,
        otherName: name,
        otherInitial: name.charAt(0).toUpperCase(),
      };
    });

    setConnections(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("connections")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update connection.");
      return;
    }
    toast.success(status === "accepted" ? "Connection accepted!" : "Connection declined.");
    fetchConnections();
  };

  const incoming = connections.filter((c) => c.recipient_id === user?.id && c.status === "pending");
  const outgoing = connections.filter((c) => c.requester_id === user?.id && c.status === "pending");
  const accepted = connections.filter((c) => c.status === "accepted");

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">SuperNetworkAI</span>
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate("/search")}>
            Search
          </Button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-800 text-foreground mb-2">
              Your Connections
            </h1>
            <p className="text-muted-foreground mb-8">
              Manage your network — accept requests, view your connections.
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-muted-foreground">Loading connections...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Incoming requests */}
              {incoming.length > 0 && (
                <section>
                  <h2 className="text-lg font-display font-700 text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    Pending Requests ({incoming.length})
                  </h2>
                  <div className="space-y-3">
                    {incoming.map((c) => (
                      <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold">
                            {c.otherInitial}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{c.otherName}</p>
                            <p className="text-xs text-muted-foreground">Wants to connect</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateStatus(c.id, "accepted")} className="gradient-hero text-primary-foreground border-0">
                            <Check className="w-4 h-4 mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "declined")}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Outgoing */}
              {outgoing.length > 0 && (
                <section>
                  <h2 className="text-lg font-display font-700 text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Sent Requests ({outgoing.length})
                  </h2>
                  <div className="space-y-3">
                    {outgoing.map((c) => (
                      <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold">
                            {c.otherInitial}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{c.otherName}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Accepted */}
              <section>
                <h2 className="text-lg font-display font-700 text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-success" />
                  Connected ({accepted.length})
                </h2>
                {accepted.length === 0 ? (
                  <div className="text-center py-8 bg-card border border-border rounded-xl">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No connections yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Search for people and send connection requests!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accepted.map((c) => (
                      <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold">
                            {c.otherInitial}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{c.otherName}</p>
                            <p className="text-xs text-success">Connected</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;
