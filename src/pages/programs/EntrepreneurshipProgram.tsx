import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntrepreneurship, useCategories } from "@/hooks/api";
import { getIcon } from "@/lib/icons";
import {
  Monitor,
  CheckCircle,
  ArrowRight,
  Rocket,
  ChevronRight,
  Building2,
} from "lucide-react";

interface Track {
  id: string;
  title?: string;
  description?: string;
  icon?: string;
}

interface Resource {
  id: string;
  title?: string;
  description?: string;
}

interface Milestone {
  id: string;
  title?: string;
  status?: string;
  date?: string;
  applicants?: number;
  accepted?: number;
}

const EntrepreneurshipProgram = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "apply" | "directory"
  >("overview");
  const [appStep, setAppStep] = useState(0);
  const [form, setForm] = useState({
    businessName: "",
    sector: "",
    website: "",
    description: "",
    teamSize: "",
    yearsOperating: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const { data: categories } = useCategories();
  const { data, isLoading, isError, refetch } = useEntrepreneurship();

  const tracks = (data?.tracks ?? []) as Track[];
  const resources = (data?.resources ?? []) as Resource[];
  const milestones = (data?.milestones ?? []) as Milestone[];
  const stats = (data?.stats ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background rounded-xl p-8 md:p-12">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
          Entrepreneurship Program
        </Badge>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
          Entrepreneurship &amp; Growth Program
        </h1>
        <p className="text-muted-foreground max-w-2xl mb-6 leading-relaxed">
          Supporting entrepreneurs and startups with funding access, mentorship,
          marketplace visibility, and skill-building resources.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
          >
            Program Overview
          </Button>
          <Button
            variant={activeTab === "apply" ? "default" : "outline"}
            onClick={() => setActiveTab("apply")}
          >
            <Rocket className="w-4 h-4 mr-1" /> Apply Now
          </Button>
          <Link to="/marketplace">
            <Button variant="outline">
              <Building2 className="w-4 h-4 mr-1" /> View Marketplace Directory
            </Button>
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="bg-card rounded-xl border border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">
            Unable to load the entrepreneurship program right now.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Stats Banner */}
          {Object.keys(stats).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-card rounded-xl border border-border p-5 text-center"
                >
                  <div className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    {String(value)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "overview" && (
            <>
              {/* Program Tracks */}
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-6">
                  What Support You'll Receive
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tracks.map((track) => {
                    const Icon = getIcon(track.icon, Monitor);
                    return (
                      <div
                        key={track.id}
                        className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-heading font-semibold text-foreground mb-2">
                          {track.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {track.description}
                        </p>
                      </div>
                    );
                  })}
                  {tracks.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No program tracks available yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Resources */}
              <div className="bg-card rounded-xl border border-border p-8">
                <h2 className="text-xl font-heading font-bold text-foreground mb-6">
                  Resources
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {resources.map((res) => (
                    <div key={res.id} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {res.title}
                        </p>
                        {res.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {res.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No resources available yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Milestones / Cohort Status */}
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-6">
                  Cohort Status
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className="bg-card rounded-xl border border-border p-6"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-heading font-semibold text-foreground">
                          {m.title}
                        </h3>
                        {m.status && (
                          <Badge
                            variant={
                              m.status === "Open" ? "default" : "secondary"
                            }
                          >
                            {m.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {m.date && (
                          <p>Start: {new Date(m.date).toLocaleDateString()}</p>
                        )}
                        {typeof m.applicants === "number" &&
                          m.applicants > 0 && (
                            <p>
                              {m.applicants} applicants · {m.accepted ?? 0}{" "}
                              accepted
                            </p>
                          )}
                      </div>
                      {m.status === "Open" && (
                        <Button
                          className="mt-4 w-full"
                          onClick={() => setActiveTab("apply")}
                        >
                          Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {milestones.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No cohorts open at this time.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "apply" && (
            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                Application Form
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Complete all steps to submit your application for the next
                cohort.
              </p>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-8">
                {["Business Info", "Details", "Contact", "Review"].map(
                  (step, i) => (
                    <div key={step} className="flex items-center gap-2 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= appStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`text-xs hidden sm:block ${i <= appStep ? "text-foreground font-medium" : "text-muted-foreground"}`}
                      >
                        {step}
                      </span>
                      {i < 3 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  ),
                )}
              </div>

              {appStep === 0 && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Business Name *
                    </label>
                    <Input
                      value={form.businessName}
                      onChange={(e) => update("businessName", e.target.value)}
                      placeholder="Your business name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Industry Sector *
                    </label>
                    <Select
                      value={form.sector}
                      onValueChange={(v) => update("sector", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories ?? []).map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Website
                    </label>
                    <Input
                      value={form.website}
                      onChange={(e) => update("website", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {appStep === 1 && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Business Description *
                    </label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      placeholder="Describe your business, value proposition, and how it creates gig opportunities..."
                      rows={5}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Team Size
                    </label>
                    <Select
                      value={form.teamSize}
                      onValueChange={(v) => update("teamSize", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        {["1-5", "6-10", "11-25", "26-50", "50+"].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s} people
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Years in Operation
                    </label>
                    <Select
                      value={form.yearsOperating}
                      onValueChange={(v) => update("yearsOperating", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "6 months - 1 year",
                          "1-2 years",
                          "2-5 years",
                          "5+ years",
                        ].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {appStep === 2 && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Contact Name *
                    </label>
                    <Input
                      value={form.contactName}
                      onChange={(e) => update("contactName", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => update("contactEmail", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Phone
                    </label>
                    <Input
                      value={form.contactPhone}
                      onChange={(e) => update("contactPhone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              )}

              {appStep === 3 && (
                <div className="space-y-4 max-w-lg">
                  <h3 className="font-heading font-semibold text-foreground">
                    Review Your Application
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Business:</span>{" "}
                      <span className="text-foreground font-medium">
                        {form.businessName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sector:</span>{" "}
                      <span className="text-foreground font-medium">
                        {(categories ?? []).find((v) => v.id === form.sector)
                          ?.name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Website:</span>{" "}
                      <span className="text-foreground font-medium">
                        {form.website || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Team Size:</span>{" "}
                      <span className="text-foreground font-medium">
                        {form.teamSize || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Years Operating:
                      </span>{" "}
                      <span className="text-foreground font-medium">
                        {form.yearsOperating || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contact:</span>{" "}
                      <span className="text-foreground font-medium">
                        {form.contactName || "—"} · {form.contactEmail || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Description:
                      </span>{" "}
                      <span className="text-foreground font-medium">
                        {form.description || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-8">
                {appStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setAppStep((s) => s - 1)}
                  >
                    Previous
                  </Button>
                )}
                {appStep < 3 ? (
                  <Button onClick={() => setAppStep((s) => s + 1)}>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    onClick={() => {
                      setActiveTab("overview");
                      setAppStep(0);
                    }}
                  >
                    Submit Application <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EntrepreneurshipProgram;
