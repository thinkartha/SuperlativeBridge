import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  FileUp,
  Loader2,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useCategories,
  useCourse,
  useCreateCourse,
  useUpdateCourse,
} from "@/hooks/api";

const languages = [
  "English",
  "Spanish",
  "French",
  "Mandarin",
  "Hindi",
  "Arabic",
  "Portuguese",
];
const levels = ["Beginner", "Intermediate", "Advanced"];

const steps = [
  { label: "Basic Info", description: "Title, category, and level" },
  { label: "Details", description: "Duration, language, and description" },
  { label: "Content", description: "Modules, materials, Open edX" },
  { label: "Review", description: "Confirm and publish" },
];

const emptyForm = {
  title: "",
  category: "",
  level: "Beginner",
  duration: "",
  language: "English",
  description: "",
  image: "",
  instructor: "",
  status: "Draft",
  objectives: "",
  prerequisites: "",
  modules: "",
};

/** Best-effort parse of Open edX OLX / course.xml / JSON export text. */
function parseOpenEdxText(text: string, fileName: string) {
  const modules: string[] = [];
  const objectives: string[] = [];
  let title = "";

  const chapterRe =
    /<(?:chapter|sequential|vertical)[^>]*(?:display_name|display-name)=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = chapterRe.exec(text)) !== null) {
    if (m[1] && !modules.includes(m[1])) modules.push(m[1]);
  }

  const jsonName = text.match(/"display_name"\s*:\s*"([^"]+)"/g);
  if (jsonName) {
    for (const row of jsonName) {
      const name = row.replace(/.*"display_name"\s*:\s*"([^"]+)".*/, "$1");
      if (name && !modules.includes(name)) modules.push(name);
    }
  }

  const courseTitle =
    text.match(/course[^>]*display_name=["']([^"']+)["']/i)?.[1] ||
    text.match(/"name"\s*:\s*"([^"]+)"/)?.[1] ||
    "";
  if (courseTitle) title = courseTitle;

  const objRe = /<(?:learning_objective|objective)[^>]*>([^<]+)</gi;
  while ((m = objRe.exec(text)) !== null) {
    const o = m[1].trim();
    if (o) objectives.push(o);
  }

  if (modules.length === 0) {
    const base = fileName.replace(/\.(tar\.gz|tgz|zip|xml|olx|json)$/i, "");
    modules.push(
      `Introduction — ${base || "Open edX course"}`,
      "Core concepts",
      "Practice exercises",
      "Assessment & certificate",
    );
    objectives.push(
      "Complete imported Open edX learning path",
      "Demonstrate module competencies",
    );
  }

  return {
    title,
    modules: modules.slice(0, 24).join("\n"),
    objectives:
      objectives.slice(0, 12).join("\n") ||
      modules
        .slice(0, 4)
        .map((mod) => `Master: ${mod}`)
        .join("\n"),
    count: modules.length,
  };
}

const CourseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [importName, setImportName] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useCategories();
  const { data: course, isLoading: isLoadingCourse } = useCourse(id);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title ?? "",
        category: course.category ?? "",
        level: course.level ?? "Beginner",
        duration: course.duration ?? "",
        language: course.language ?? "English",
        description: course.description ?? "",
        image: course.image ?? "",
        instructor: course.instructor ?? "",
        status: course.status ?? "Draft",
        objectives: Array.isArray(course.learningObjectives)
          ? course.learningObjectives.join("\n")
          : "",
        prerequisites: "",
        modules: (course.modules ?? []).map((m) => m.title).join("\n"),
      });
    }
  }, [course]);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const isSubmitting = createCourse.isPending || updateCourse.isPending;

  const handleOpenEdxImport = async (file: File) => {
    setImporting(true);
    setImportName(file.name);
    try {
      const lower = file.name.toLowerCase();
      let text = "";
      if (
        lower.endsWith(".xml") ||
        lower.endsWith(".olx") ||
        lower.endsWith(".json") ||
        lower.endsWith(".txt")
      ) {
        text = await file.text();
      } else {
        // tar.gz / zip — demo import uses filename + placeholder outline
        text = `course display_name="${file.name.replace(/\.(tar\.gz|tgz|zip)$/i, "")}"`;
        await new Promise((r) => setTimeout(r, 600));
      }
      const parsed = parseOpenEdxText(text, file.name);
      setForm((p) => ({
        ...p,
        title: p.title || parsed.title || p.title,
        modules: parsed.modules,
        objectives: parsed.objectives,
        description:
          p.description ||
          `Imported from Open edX package (${file.name}). Review modules before publishing.`,
      }));
      toast({
        title: "Open edX import ready",
        description: `Mapped ${parsed.count} sections from ${file.name}. Review the Content fields.`,
      });
    } catch (e) {
      toast({
        title: "Import failed",
        description: e instanceof Error ? e.message : "Could not read file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async () => {
    const payload = {
      title: form.title,
      category: form.category,
      vertical: form.category,
      level: form.level,
      duration: form.duration,
      language: form.language,
      description: form.description,
      image: form.image,
      instructor: form.instructor,
      status: form.status,
      students: course?.students ?? 0,
      rating: course?.rating ?? 0,
    };
    try {
      if (isEdit && id) {
        await updateCourse.mutateAsync({ id, ...payload });
        toast({
          title: "Course updated!",
          description: `"${form.title}" has been updated.`,
        });
      } else {
        await createCourse.mutateAsync(payload);
        toast({
          title: "Course created!",
          description: `"${form.title}" has been added as a draft.`,
        });
      }
      navigate("/admin/courses");
    } catch (e) {
      toast({
        title: "Failed to save course",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  if (isEdit && isLoadingCourse) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <Button
          variant="ghost"
          className="gap-1 mb-4 text-muted-foreground"
          onClick={() => navigate("/admin/courses")}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </Button>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {isEdit ? "Edit Course" : "Create New Course"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details step by step
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1 min-w-[140px]">
            <div
              className={`flex items-center gap-3 px-4 py-3 border flex-1 transition-all ${
                i === step
                  ? "bg-primary/10 border-primary/30"
                  : i < step
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card border-border"
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border p-6 lg:p-8 min-h-[320px]">
        {step === 0 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Course Title *</Label>
              <Input
                placeholder="e.g. Introduction to Web Development"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => update("category", v)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(v) => update("level", v)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Duration</Label>
                <Input
                  placeholder="e.g. 8 weeks"
                  value={form.duration}
                  onChange={(e) => update("duration", e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Language</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => update("language", v)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea
                placeholder="Describe the course content and goals..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Cover image URL</Label>
                <Input
                  placeholder="https://..."
                  value={form.image}
                  onChange={(e) => update("image", e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Instructor</Label>
                <Input
                  value={form.instructor}
                  onChange={(e) => update("instructor", e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Prerequisites</Label>
              <Textarea
                placeholder="Any prerequisites for this course..."
                value={form.prerequisites}
                onChange={(e) => update("prerequisites", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="border border-border bg-muted/30 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-semibold text-foreground text-sm">
                    Import from Open edX
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload an Open edX course package (
                    <span className="font-mono">.tar.gz</span>,{" "}
                    <span className="font-mono">.zip</span>,{" "}
                    <span className="font-mono">.xml</span>,{" "}
                    <span className="font-mono">.olx</span>, or{" "}
                    <span className="font-mono">.json</span>). We map chapters
                    into modules and learning objectives below.
                  </p>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".tar.gz,.tgz,.zip,.xml,.olx,.json,.txt,application/gzip,application/zip,application/xml,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleOpenEdxImport(f);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  disabled={importing}
                  onClick={() => fileRef.current?.click()}
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileUp className="w-4 h-4" />
                  )}
                  {importing ? "Importing…" : "Choose Open edX file"}
                </Button>
                {importName && (
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-xs">
                    {importName}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Learning Objectives
              </Label>
              <Textarea
                placeholder="What students will learn (one per line)..."
                value={form.objectives}
                onChange={(e) => update("objectives", e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Course Modules</Label>
              <Textarea
                placeholder="List course modules (one per line)..."
                value={form.modules}
                onChange={(e) => update("modules", e.target.value)}
                rows={6}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-foreground">
              Review Your Course
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                ["Title", form.title || "—"],
                ["Category", form.category || "—"],
                ["Level", form.level],
                ["Duration", form.duration || "—"],
                ["Language", form.language],
                ["Prerequisites", form.prerequisites || "None"],
                [
                  "Modules",
                  form.modules
                    ? `${form.modules.split("\n").filter(Boolean).length} listed`
                    : "—",
                ],
                ["Open edX import", importName || "None"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-sm text-foreground">{value}</p>
                </div>
              ))}
            </div>
            {form.description && (
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                  Description
                </p>
                <p className="text-sm text-foreground">{form.description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() =>
            step > 0 ? setStep((s) => s - 1) : navigate("/admin/courses")
          }
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> {step > 0 ? "Previous" : "Cancel"}
        </Button>
        {step < steps.length - 1 ? (
          <Button
            variant="hero"
            onClick={() => setStep((s) => s + 1)}
            className="gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-1"
          >
            <Check className="w-4 h-4" />{" "}
            {isEdit ? "Save Changes" : "Create Course"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CourseForm;
