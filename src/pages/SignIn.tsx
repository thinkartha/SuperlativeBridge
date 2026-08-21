import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, isCognitoAuthMode } from "@/contexts/AuthContext";
import type { Role } from "@/types/api";

// Seeded local/demo accounts (see backend/migrations/002_seed.sql)
const demoAccounts = [
  { email: "admin@example.com", password: "password123", role: "Admin" },
  { email: "maria@example.com", password: "password123", role: "GIG Worker" },
  { email: "aisha@example.com", password: "password123", role: "Employer" },
  {
    email: "sarah.mentor@example.com",
    password: "password123",
    role: "Mentor",
  },
];

const roleRedirect: Record<Role, string> = {
  admin: "/admin",
  employer: "/employer/search",
  worker: "/student",
  mentor: "/mentor",
};

const showDemoSwitcher = import.meta.env.DEV;

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setSubmitting(true);
    try {
      const user = await signIn(demoEmail, demoPassword);
      toast({
        title: `Signed in as ${user.name}`,
        description: "Redirecting to your dashboard...",
      });
      navigate(roleRedirect[user.role] || "/student");
    } catch (err) {
      toast({
        title: "Sign in failed",
        description:
          err instanceof Error
            ? err.message
            : "Demo login failed. Is the local API running?",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const user = await signIn(email, password);
      toast({
        title: `Welcome back, ${user.name}!`,
        description: "Redirecting to your dashboard...",
      });
      navigate(roleRedirect[user.role] || "/student");
    } catch (err) {
      toast({
        title: "Sign in failed",
        description:
          err instanceof Error
            ? err.message
            : "Please check your credentials and try again.",
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
            Welcome back to your <span className="text-primary">journey</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Continue building your skills, connecting with mentors, and
            unlocking new opportunities.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="font-heading font-bold text-lg text-foreground">
              SuperlativeBridge
            </span>
          </div>

          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Sign In
          </h1>
          <p className="text-muted-foreground mb-8">
            {isCognitoAuthMode
              ? "Sign in with your SuperlativeBridge account"
              : "Enter your credentials to access your account"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
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
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="rounded border-border" />{" "}
                Remember me
              </label>
              <a href="#" className="text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <Button
              type="submit"
              variant="hero"
              className="w-full h-12 text-base"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {showDemoSwitcher && (
            <div className="mt-8 border border-border p-4 bg-muted/30">
              <p className="text-xs font-medium text-foreground mb-1">
                Demo account switcher
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                One click signs you in and redirects to that role's dashboard.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {demoAccounts.map((a) => (
                  <Button
                    key={a.email}
                    type="button"
                    variant="outline"
                    className="h-auto flex-col items-start gap-0.5 py-2 text-left"
                    disabled={submitting}
                    onClick={() => {
                      setEmail(a.email);
                      setPassword(a.password);
                      void handleDemoLogin(a.email, a.password);
                    }}
                  >
                    <span className="text-sm font-medium text-foreground">
                      {submitting && email === a.email ? "Signing in…" : a.role}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {a.email}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-muted-foreground text-sm mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary font-medium hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
