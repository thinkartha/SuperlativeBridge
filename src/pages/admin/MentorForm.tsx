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
  useMentor,
  useCreateMentor,
  useUpdateMentor,
} from "@/hooks/api";

const steps = [
  { label: "Personal Info", description: "Name, email, and contact" },
  { label: "Expertise", description: "Vertical and skills" },
  { label: "Bio & Review", description: "Background and confirm" },
];

const emptyForm = {
  name: "",
  email: "",
  vertical: "",
  expertise: "",
  bio: "",
  status: "Active",
};

const MentorForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);

  const { data: categories } = useCategories();
  const { data: mentor, isLoading: isLoadingMentor } = useMentor(id);
  const createMentor = useCreateMentor();
  const updateMentor = useUpdateMentor();

  useEffect(() => {
    if (mentor) {
      setForm({
        name: mentor.name ?? "",
        email: mentor.email ?? "",
        vertical: mentor.vertical ?? "",
        expertise: (mentor.expertise ?? []).join(", "),
        bio: mentor.bio ?? "",
        status: mentor.status ?? "Active",
      });
    }
  }, [mentor]);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const isSubmitting = createMentor.isPending || updateMentor.isPending;

  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      email: form.email,
      vertical: form.vertical,
      expertise: form.expertise
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      bio: form.bio,
      status: form.status,
    };
    try {
      if (isEdit && id) {
        await updateMentor.mutateAsync({ id, ...payload });
        toast({
          title: "Mentor updated!",
          description: `${form.name} has been updated.`,
        });
      } else {
        await createMentor.mutateAsync(payload);
        toast({
          title: "Mentor added!",
          description: `${form.name} has been added as a mentor.`,
        });
      }
      navigate("/admin/mentors");
    } catch (e) {
      toast({
        title: "Failed to save mentor",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  if (isEdit && isLoadingMentor) {
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
          onClick={() => navigate("/admin/mentors")}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Mentors
        </Button>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {isEdit ? "Edit Mentor" : "Add New Mentor"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEdit
            ? "Update mentor details"
            : "Register a new mentor step by step"}
        </p>
      </div>

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

      <div className="bg-card rounded-xl border border-border p-8 min-h-[320px]">
        {step === 0 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Full Name *</Label>
              <Input
                placeholder="e.g. Dr. Sarah Johnson"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Email *</Label>
              <Input
                type="email"
                placeholder="mentor@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Vertical *</Label>
              <Select
                value={form.vertical}
                onValueChange={(v) => update("vertical", v)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select vertical" />
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
              <Label className="text-sm font-semibold">
                Expertise (comma separated)
              </Label>
              <Input
                placeholder="e.g. React, AWS, Leadership"
                value={form.expertise}
                onChange={(e) => update("expertise", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Bio</Label>
              <Textarea
                placeholder="Brief background and teaching philosophy..."
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                rows={5}
              />
            </div>
            <h3 className="text-lg font-heading font-bold text-foreground mt-6">
              Review
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Name", form.name || "—"],
                ["Email", form.email || "—"],
                ["Vertical", form.vertical || "—"],
                ["Expertise", form.expertise || "—"],
                ["Status", form.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-sm text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() =>
            step > 0 ? setStep((s) => s - 1) : navigate("/admin/mentors")
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
            {isEdit ? "Save Changes" : "Add Mentor"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MentorForm;
