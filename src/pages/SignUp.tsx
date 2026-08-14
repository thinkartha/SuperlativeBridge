import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types/api";

const steps = ["Account", "Role", "Details"];

const roleToApiRole: Record<string, Role> = {
  gigworker: "worker",
  professional: "worker",
  experienced: "worker",
  employer: "employer",
  mentor: "mentor",
};

const roleRedirect: Record<Role, string> = {
  admin: "/admin",
  employer: "/employer/search",
  worker: "/student",
  mentor: "/student",
};

const SignUp = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    phone: "",
    location: "",
    linkedin: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const update = (field: string, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const nextStep = () => {
    if (
      step === 0 &&
      (!formData.firstName || !formData.email || !formData.password)
    ) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }
    if (step === 1 && !formData.role) {
      toast({
        title: "Error",
        description: "Please select your role",
        variant: "destructive",
      });
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) {
      toast({
        title: "Error",
        description: "Please select your role",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      const apiRole = roleToApiRole[formData.role] ?? "worker";
      const user = await signUp({
        name,
        email: formData.email,
        password: formData.password,
        role: apiRole,
      });
      toast({
        title: "Account created!",
        description: "Welcome to SuperlativeBridge. Let's build your persona.",
      });
      navigate(roleRedirect[user.role] || "/courses");
    } catch (err) {
      toast({
        title: "Sign up failed",
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-56 h-56 bg-accent/10 rounded-full blur-[80px]" />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <span className="font-heading font-bold text-2xl text-foreground">
              SuperlativeBridge
            </span>
          </div>
          <h2 className="text-4xl font-heading font-bold text-foreground mb-4">
            Start your <span className="text-primary">journey</span> today
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Join thousands of learners building skills, earning certifications,
            and connecting with top employers.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { n: "100K+", l: "Learners" },
              { n: "10K+", l: "Courses" },
              { n: "5K+", l: "Employers" },
              { n: "50+", l: "Languages" },
            ].map((s) => (
              <div
                key={s.l}
                className="bg-background/60 backdrop-blur rounded-xl p-4 border border-border/50"
              >
                <div className="text-xl font-heading font-bold text-primary">
                  {s.n}
                </div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - wizard form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="font-heading font-bold text-lg text-foreground">
              SuperlativeBridge
            </span>
          </div>

          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Create Account
          </h1>
          <p className="text-muted-foreground mb-6">
            Build your professional persona on SuperlativeBridge
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:block ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}
                >
                  {s}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={(e) => update("password", e.target.value)}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Label>I am a *</Label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      value: "gigworker",
                      label: "GIG Worker",
                      desc: "Looking for gig opportunities, courses & certifications",
                    },
                    {
                      value: "professional",
                      label: "Professional",
                      desc: "Working professional seeking to upskill",
                    },
                    {
                      value: "experienced",
                      label: "Experienced",
                      desc: "Senior professional with deep domain expertise",
                    },
                    {
                      value: "employer",
                      label: "Employer",
                      desc: "Looking to hire skilled candidates",
                    },
                    {
                      value: "mentor",
                      label: "Mentor",
                      desc: "Want to teach and guide learners",
                    },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => update("role", r.value)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        formData.role === r.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="font-medium text-foreground">
                        {r.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State"
                    value={formData.location}
                    onChange={(e) => update("location", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input
                    id="linkedin"
                    placeholder="linkedin.com/in/yourname"
                    value={formData.linkedin}
                    onChange={(e) => update("linkedin", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="h-12 flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  variant="hero"
                  onClick={nextStep}
                  className="h-12 flex-1"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="hero"
                  className="h-12 flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Creating account..." : "Create Account"}{" "}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-primary font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
