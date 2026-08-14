import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Briefcase,
  Mail,
  Phone,
  ChevronLeft,
  Globe,
  Search,
  Star,
  DollarSign,
  GraduationCap,
  BadgeCheck,
  FileText,
  Shield,
} from "lucide-react";
import { useCandidate } from "@/hooks/api";

const CandidateProfile = () => {
  const { id } = useParams();
  const { data: candidate, isLoading, isError, error } = useCandidate(id);

  return (
    <div className="w-full">
      <Link
        to="/employer/search"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to search
      </Link>

      {isLoading && (
        <div className="border border-border p-8 space-y-4">
          <Skeleton className="h-20 w-20" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      )}

      {isError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 text-sm">
          Failed to load candidate
          {error instanceof Error ? `: ${error.message}` : "."}
        </div>
      )}

      {!isLoading && !isError && !candidate && (
        <div className="text-center py-16 border border-border">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-foreground mb-2">
            Candidate not found
          </h3>
        </div>
      )}

      {!isLoading && !isError && candidate && (
        <div className="space-y-6">
          <div className="border border-border bg-card p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="w-24 h-24 bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-2xl shrink-0">
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                  <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">
                      {candidate.name}
                    </h1>
                    <p className="text-lg text-foreground/80">{candidate.title}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {candidate.availability === "hiring"
                        ? "Actively interviewing"
                        : candidate.availability === "passive"
                          ? "Open to offers"
                          : "Open to work"}
                    </Badge>
                    {candidate.visaStatus && (
                      <Badge variant="outline">{candidate.visaStatus}</Badge>
                    )}
                    {candidate.openToRelocate && (
                      <Badge variant="outline">Open to relocate</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground mb-4">
                  {candidate.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {candidate.location}
                    </span>
                  )}
                  {candidate.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {candidate.email}
                    </span>
                  )}
                  {candidate.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {candidate.phone}
                    </span>
                  )}
                  {candidate.vertical && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {candidate.vertical}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {candidate.rating}
                  </span>
                  {candidate.billingRate > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />${candidate.billingRate}
                      /hr
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {(candidate.skills ?? []).map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="hero" className="gap-2" asChild>
                    <a href={candidate.email ? `mailto:${candidate.email}` : "#"}>
                      <Mail className="w-4 h-4" /> Contact candidate
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      const el = document.getElementById("candidate-resume");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <FileText className="w-4 h-4" /> View resume
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-border bg-card p-6">
                <h2 className="font-heading font-semibold text-foreground mb-3">
                  About
                </h2>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {candidate.bio || "No bio provided."}
                </p>
              </div>

              <div
                id="candidate-resume"
                className="border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Resume
                  </h2>
                  {candidate.resumeUrl && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {candidate.resumeUrl}
                    </span>
                  )}
                </div>
                <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans bg-muted/30 border border-border p-5 max-h-[32rem] overflow-y-auto">
                  {candidate.resumeText ||
                    `${candidate.name}\n${candidate.location || ""}\n\n${candidate.title || ""}\n\n${candidate.bio || "Resume not uploaded yet."}`}
                </pre>
              </div>

              <div className="border border-border bg-card p-6">
                <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Skills
                </h2>
                {(candidate.skills ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(candidate.skills ?? []).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed.</p>
                )}
              </div>

              {(candidate.programs ?? []).length > 0 && (
                <div className="border border-border bg-card p-6">
                  <h2 className="font-heading font-semibold text-foreground mb-3">
                    Government programs
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.programs.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="border border-border bg-card p-6">
                <h3 className="font-heading font-semibold text-foreground mb-3">
                  Profile details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Experience
                    </span>
                    <span className="text-foreground text-right">
                      {candidate.experience || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> Education
                    </span>
                    <span className="text-foreground text-right">
                      {candidate.education || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Visa
                    </span>
                    <span className="text-foreground text-right">
                      {candidate.visaStatus || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Vertical</span>
                    <span className="text-foreground text-right">
                      {candidate.vertical || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-foreground text-right">
                      {candidate.location || "—"}
                    </span>
                  </div>
                  {candidate.zip && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">ZIP</span>
                      <span className="text-foreground">{candidate.zip}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;
