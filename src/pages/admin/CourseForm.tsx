import { useEffect, useState } from "react";
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
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
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
  { label: "Content", description: "Modules and materials" },
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

const CourseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);

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
        objectives: "",
        prerequisites: "",
        modules: "",
      });
    }
  }, [course]);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const isSubmitting = createCourse.isPending || updateCourse.isPending;

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
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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

      {/* Wizard Steps */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border flex-1 transition-all ${
                i === step
                  ? "bg-primary/10 border-primary/30"
                  : i < step
                    ? "bg-green-50 border-green-200"
                    : "bg-card border-border"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground">
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-xl border border-border p-8 min-h-[320px]">
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
            <div className="grid grid-cols-2 gap-6">
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
            <div className="grid grid-cols-2 gap-6">
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
            <div className="grid grid-cols-2 gap-6">
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
            <div className="grid grid-cols-2 gap-6">
              {[
                ["Title", form.title || "—"],
                ["Category", form.category || "—"],
                ["Level", form.level],
                ["Duration", form.duration || "—"],
                ["Language", form.language],
                ["Prerequisites", form.prerequisites || "None"],
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

      {/* Navigation */}
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
