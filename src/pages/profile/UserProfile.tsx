import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  GraduationCap,
  Briefcase,
  Award,
  DollarSign,
  FileText,
  Plus,
  X,
  Save,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUser, useUpdateUser, useCertifications } from "@/hooks/api";

const govPrograms = [
  "WOTC",
  "HUBZone",
  "Veterans",
  "MWBE",
  "8(a) Program",
  "SDVOSB",
  "Refugee Employment",
  "SNAP E&T",
  "TANF",
  "Pell Grant",
];
const skillSuggestions = [
  "React",
  "Python",
  "AWS",
  "SQL",
  "Tableau",
  "Agile",
  "Scrum",
  "Leadership",
  "Java",
  "C++",
  "Figma",
  "TensorFlow",
  "NLP",
  "Cybersecurity",
  "HVAC",
  "Electrical",
];

const UserProfile = () => {
  const { user } = useAuth();
  const { data: profileData, isLoading, isError, refetch } = useUser(user?.id);
  const { data: certifications } = useCertifications(user?.id);
  const updateUser = useUpdateUser();

  const [activeSection, setActiveSection] = useState("personal");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [education, setEducation] = useState<
    { degree: string; school: string; year: string; gpa: string }[]
  >([]);
  const [workHistory, setWorkHistory] = useState<
    {
      title: string;
      company: string;
      from: string;
      to: string;
      description: string;
    }[]
  >([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [financials, setFinancials] = useState({
    studentDebt: "",
    creditScore: "",
    annualIncome: "",
    desiredRate: "",
  });

  useEffect(() => {
    if (profileData) {
      setProfile({
        name: profileData.name ?? "",
        email: profileData.email ?? "",
        phone: profileData.phone ?? "",
        location: profileData.location ?? "",
        bio: profileData.bio ?? "",
      });
      setSkills(profileData.skills ?? []);
    }
  }, [profileData]);

  const sections = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "skills", label: "Skills", icon: Award },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "work", label: "Work History", icon: Briefcase },
    { id: "certifications", label: "Certifications", icon: FileText },
    { id: "programs", label: "Gov Programs", icon: Shield },
    { id: "financials", label: "Financial", icon: DollarSign },
  ];

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const savePersonal = () => {
    if (!user?.id) return;
    updateUser.mutate({ id: user.id, ...profile });
  };

  const saveSkills = () => {
    if (!user?.id) return;
    updateUser.mutate({ id: user.id, skills });
  };

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const profileCompleteness = profileData
    ? Math.round(
        (["name", "email", "phone", "location", "bio"].filter(
          (f) => (profileData as unknown as Record<string, unknown>)[f],
        ).length /
          5) *
          100,
      )
    : 0;

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !profileData) {
    return (
      <div className="text-center py-24 w-full">
        <p className="text-muted-foreground mb-4">
          Unable to load your profile.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-[calc(100vh-5rem)] -mx-6 lg:-mx-8 -my-6 lg:-my-8 border-t border-border bg-background">
      {/* Left sidebar navigation */}
      <aside className="w-64 shrink-0 border-r border-border bg-card p-6 hidden md:block">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-2xl mx-auto mb-3">
            {initials || "?"}
          </div>
          <h3 className="font-heading font-semibold text-foreground">
            {profile.name || "—"}
          </h3>
          <p className="text-xs text-muted-foreground capitalize">
            {profileData.role}
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Profile</span>
              <span className="font-medium text-foreground">
                {profileCompleteness}%
              </span>
            </div>
            <Progress value={profileCompleteness} className="h-1.5" />
          </div>
        </div>

        <nav className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 w-full min-w-0 bg-background">
        <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border ${
                activeSection === s.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {activeSection === "personal" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Personal Information
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your profile details
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Full Name</Label>
                <Input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, name: e.target.value }))
                  }
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Email</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Phone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Location</Label>
                <Input
                  value={profile.location}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, location: e.target.value }))
                  }
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Bio</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, bio: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="hero"
                className="gap-2"
                onClick={savePersonal}
                disabled={updateUser.isPending}
              >
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </div>
        )}

        {activeSection === "skills" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Skills
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Add your technical and professional skills
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <div className="flex gap-3">
                <Input
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  className="h-10 flex-1 max-w-sm"
                />
                <Button
                  variant="hero"
                  size="sm"
                  onClick={addSkill}
                  className="gap-1 h-10"
                >
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No skills added yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-sm py-1.5 px-3 gap-2"
                    >
                      {s}{" "}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => setSkills(skills.filter((x) => x !== s))}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                  Suggested Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {skillSuggestions
                    .filter((s) => !skills.includes(s))
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => setSkills([...skills, s])}
                        className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="hero"
                  className="gap-2"
                  onClick={saveSkills}
                  disabled={updateUser.isPending}
                >
                  <Save className="w-4 h-4" /> Save Skills
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "education" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">
                  Education
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Your educational background
                </p>
              </div>
              <Button
                variant="hero"
                size="sm"
                className="gap-1"
                onClick={() =>
                  setEducation([
                    ...education,
                    { degree: "", school: "", year: "", gpa: "" },
                  ])
                }
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
            {education.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No education records added yet.
              </p>
            )}
            {education.map((edu, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <GraduationCap className="w-5 h-5 text-primary mt-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() =>
                      setEducation(education.filter((_, j) => j !== i))
                    }
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Degree / Program
                    </Label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => {
                        const n = [...education];
                        n[i].degree = e.target.value;
                        setEducation(n);
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      School / Institution
                    </Label>
                    <Input
                      value={edu.school}
                      onChange={(e) => {
                        const n = [...education];
                        n[i].school = e.target.value;
                        setEducation(n);
                      }}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Year</Label>
                    <Input
                      value={edu.year}
                      onChange={(e) => {
                        const n = [...education];
                        n[i].year = e.target.value;
                        setEducation(n);
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">GPA</Label>
                    <Input
                      value={edu.gpa}
                      onChange={(e) => {
                        const n = [...education];
                        n[i].gpa = e.target.value;
                        setEducation(n);
                      }}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "work" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">
                  Work History
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Your professional experience
                </p>
              </div>
              <Button
                variant="hero"
                size="sm"
                className="gap-1"
                onClick={() =>
                  setWorkHistory([
                    ...workHistory,
                    {
                      title: "",
                      company: "",
                      from: "",
                      to: "",
                      description: "",
                    },
                  ])
                }
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
            {workHistory.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No work history added yet.
              </p>
            )}
            {workHistory.map((job, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <Briefcase className="w-5 h-5 text-primary mt-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() =>
                      setWorkHistory(workHistory.filter((_, j) => j !== i))
                    }
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Job Title</Label>
                    <Input
                      value={job.title}
                      onChange={(e) => {
                        const n = [...workHistory];
                        n[i].title = e.target.value;
                        setWorkHistory(n);
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Company</Label>
                    <Input
                      value={job.company}
                      onChange={(e) => {
                        const n = [...workHistory];
                        n[i].company = e.target.value;
                        setWorkHistory(n);
                      }}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">From</Label>
                    <Input
                      value={job.from}
                      onChange={(e) => {
                        const n = [...workHistory];
                        n[i].from = e.target.value;
                        setWorkHistory(n);
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">To</Label>
                    <Input
                      value={job.to}
                      onChange={(e) => {
                        const n = [...workHistory];
                        n[i].to = e.target.value;
                        setWorkHistory(n);
                      }}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Description</Label>
                  <Textarea
                    value={job.description}
                    onChange={(e) => {
                      const n = [...workHistory];
                      n[i].description = e.target.value;
                      setWorkHistory(n);
                    }}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "certifications" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Certifications
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Professional certifications and licenses
              </p>
            </div>
            {!certifications || certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No certifications on file yet.
              </p>
            ) : (
              certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-card rounded-xl border border-border p-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {cert.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cert.issuer} · Expires {cert.expiresAt}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {cert.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}

        {activeSection === "programs" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Government Programs
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Select applicable government assistance and qualification
                programs
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {govPrograms.map((p) => (
                  <label
                    key={p}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPrograms.includes(p)}
                      onChange={() =>
                        setSelectedPrograms((prev) =>
                          prev.includes(p)
                            ? prev.filter((x) => x !== p)
                            : [...prev, p],
                        )
                      }
                    />
                    <span className="text-sm font-medium text-foreground">
                      {p}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === "financials" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Financial Information
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Debt, credits, and financial aid eligibility
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Total Student Debt ($)
                  </Label>
                  <Input
                    type="number"
                    value={financials.studentDebt}
                    onChange={(e) =>
                      setFinancials((p) => ({
                        ...p,
                        studentDebt: e.target.value,
                      }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Credit Score</Label>
                  <Input
                    type="number"
                    value={financials.creditScore}
                    onChange={(e) =>
                      setFinancials((p) => ({
                        ...p,
                        creditScore: e.target.value,
                      }))
                    }
                    className="h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Annual Income ($)
                  </Label>
                  <Input
                    type="number"
                    value={financials.annualIncome}
                    onChange={(e) =>
                      setFinancials((p) => ({
                        ...p,
                        annualIncome: e.target.value,
                      }))
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Desired Billing Rate ($/hr)
                  </Label>
                  <Input
                    type="number"
                    value={financials.desiredRate}
                    onChange={(e) =>
                      setFinancials((p) => ({
                        ...p,
                        desiredRate: e.target.value,
                      }))
                    }
                    className="h-11"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="hero" className="gap-2">
                <Save className="w-4 h-4" /> Save Financial Info
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
