import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommunity, useRsvpEvent } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import { getIcon } from "@/lib/icons";
import {
  Users,
  Calendar,
  BookOpen,
  ArrowRight,
  Search,
  MessageSquare,
  Check,
  Loader2,
} from "lucide-react";
import type { CommunityEvent, CommunityGroup, CommunityPost } from "@/types/api";

const CommunityHub = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [rsvped, setRsvped] = useState<Record<string, boolean>>({});
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError, refetch } = useCommunity();
  const rsvp = useRsvpEvent();

  const posts = (data?.posts ?? []) as CommunityPost[];
  const events = (data?.events ?? []) as CommunityEvent[];
  const groups = (data?.groups ?? []) as CommunityGroup[];

  const resourcePosts = useMemo(
    () =>
      posts.map((p) => ({
        ...p,
        description: p.description ?? p.body ?? "",
        items: p.items ?? p.likes ?? 0,
      })),
    [posts],
  );

  const categories = [
    "all",
    ...Array.from(
      new Set(resourcePosts.map((r) => r.category).filter(Boolean)),
    ),
  ] as string[];
  const filtered = resourcePosts.filter(
    (r) =>
      (activeCategory === "all" || r.category === activeCategory) &&
      ((r.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? "").toLowerCase().includes(search.toLowerCase())),
  );

  const handleRsvp = (event: CommunityEvent) => {
    if (!event.id) return;
    if (!isAuthenticated) {
      toast.error("Sign in to RSVP for community events");
      return;
    }
    if (rsvped[event.id]) return;
    rsvp.mutate(event.id, {
      onSuccess: () => {
        setRsvped((prev) => ({ ...prev, [event.id]: true }));
      },
    });
  };

  return (
    <div className="w-full space-y-8">
      <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-background border border-border p-8 md:p-12">
        <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
          Community
        </Badge>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
          SuperlativeBridge Community Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mb-6 leading-relaxed">
          A community for entrepreneurs, professionals, and learners. Access
          guides, resources, expert insights on business development, finance,
          legal, marketing, and more.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="hero">
            <Users className="w-4 h-4 mr-1" /> Join the Community
          </Button>
          <Button variant="outline">
            <BookOpen className="w-4 h-4 mr-1" /> Browse Resources
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: BookOpen,
            title: "Resources & Guides",
            desc: "Access business development, marketing, finance, and legal resources",
          },
          {
            icon: MessageSquare,
            title: "Community & Leaders",
            desc: "Connect with innovators, entrepreneurs, and thought leaders",
          },
          {
            icon: Calendar,
            title: "Events & Workshops",
            desc: "Attend workshops, webinars, and networking events",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-card border border-border p-6"
          >
            <item.icon className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-heading font-semibold text-foreground mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="bg-card border border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">
            Unable to load community content right now.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">
              Resources
            </h2>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resources..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                    className="text-xs"
                  >
                    {cat === "all" ? "All" : cat}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((resource) => {
                const Icon = getIcon(resource.icon, BookOpen);
                return (
                  <div
                    key={resource.id}
                    className="bg-card border border-border p-6 hover:border-primary/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      {resource.category && (
                        <Badge variant="secondary" className="text-xs">
                          {resource.category}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-foreground mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {resource.items ?? 0} resources
                      </span>
                      <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Explore <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No resources found.
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">
              Upcoming Events
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {events.map((event) => {
                const done = !!rsvped[event.id];
                const pending = rsvp.isPending && rsvp.variables === event.id;
                return (
                  <div
                    key={event.id}
                    className="bg-card border border-border p-6 flex items-start gap-4"
                  >
                    <div className="bg-primary/10 p-3 text-center min-w-[60px]">
                      <div className="text-lg font-heading font-bold text-primary">
                        {event.date ? new Date(event.date).getDate() : "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.date
                          ? new Date(event.date).toLocaleString("default", {
                              month: "short",
                            })
                          : ""}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-foreground mb-1">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {event.type && (
                          <Badge variant="secondary" className="text-xs">
                            {event.type}
                          </Badge>
                        )}
                        <span>{event.attendees ?? 0} registered</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={done ? "secondary" : "outline"}
                      disabled={done || pending}
                      className="gap-1 shrink-0"
                      onClick={() => handleRsvp(event)}
                    >
                      {pending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : done ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : null}
                      {done ? "Registered" : "RSVP"}
                    </Button>
                  </div>
                );
              })}
            </div>
            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming events.
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">
              Community Leaders
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {groups.map((leader) => (
                <div
                  key={leader.id}
                  className="bg-card border border-border p-6 text-center"
                >
                  <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-heading font-bold text-primary">
                      {leader.avatar ?? leader.name?.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">
                    {leader.name}
                  </h3>
                  <p className="text-xs text-primary font-medium">
                    {leader.role ?? leader.category}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {leader.expertise ??
                      (leader.members != null
                        ? `${leader.members} members`
                        : "")}
                  </p>
                </div>
              ))}
            </div>
            {groups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No community groups found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommunityHub;
