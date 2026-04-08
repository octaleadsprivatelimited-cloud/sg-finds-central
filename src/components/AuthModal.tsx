import { useState, forwardRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = "login" | "signup" | "forgot";
const googleProvider = new GoogleAuthProvider();

const SocialIcon = forwardRef<HTMLSpanElement, { name: string; loading: boolean }>(
  ({ name, loading }, ref) => {
    if (loading) return <span ref={ref}><Loader2 className="w-5 h-5 animate-spin shrink-0" /></span>;
    const icon = (() => {
      switch (name) {
        case "google":
          return (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          );
        default: return null;
      }
    })();
    return <span ref={ref}>{icon}</span>;
  }
);
SocialIcon.displayName = "SocialIcon";

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const { devLogin } = useAuth();
  const DEV_BYPASS_ENABLED = import.meta.env.VITE_ENABLE_DEV_BYPASS === "true";
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (!result.user.emailVerified) {
          await sendEmailVerification(result.user, {
            url: window.location.origin,
          });
          await auth.signOut();
          toast.error("Email not verified. A new verification link has been sent to your inbox.");
          setLoading(false);
          return;
        }
        toast.success("Signed in successfully");
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user, {
          url: window.location.origin,
        });
        await auth.signOut();
        toast.success("Account created! Please check your email and verify your account before signing in.");
        setMode("login");
        setLoading(false);
        return;
      }
      onClose();
    } catch (err: any) {
      const code = err?.code || "";
      const friendlyMessages: Record<string, string> = {
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential": "Incorrect email or password. Please try again.",
        "auth/user-not-found": "No account found with this email.",
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/weak-password": "Password is too weak. Use at least 6 characters.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Please check your connection.",
      };
      toast.error(friendlyMessages[code] || "Authentication failed. Please try again.");
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
      });
      toast.success("Password reset email sent! Check your inbox.");
      setMode("login");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    }
    setLoading(false);
  };

  const handleSocialSignIn = async (providerName: string) => {
    setSocialLoading(providerName);
    try {
      const provider = providerName === "google" ? googleProvider : appleProvider;
      await signInWithPopup(auth, provider);
      toast.success(`Signed in with ${providerName.charAt(0).toUpperCase() + providerName.slice(1)}`);
      onClose();
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || `${providerName} sign-in failed`);
      }
    }
    setSocialLoading(null);
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md gap-3" aria-describedby="auth-modal-desc">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {mode === "forgot" ? "Reset password" : mode === "login" ? "Welcome back" : "Create account"}
          </DialogTitle>
          <p id="auth-modal-desc" className="text-xs sm:text-sm text-muted-foreground">
            {mode === "forgot" ? "Enter your email to receive a reset link" : "Sign in to manage your business listings"}
          </p>
        </DialogHeader>

        {/* Social Sign-In — icon-only row */}
        <div className="flex gap-3 justify-center">
          {(["google", "apple"] as const).map((provider) => (
            <Button
              key={provider}
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl"
              onClick={() => handleSocialSignIn(provider)}
              disabled={!!socialLoading}
              title={`Continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
            >
              <SocialIcon name={provider} loading={socialLoading === provider} />
            </Button>
          ))}
        </div>

        <div className="relative my-1">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
            or
          </span>
        </div>


        {mode === "forgot" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Email</Label>
              <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
                <Input type="email" placeholder="you@example.com" className="h-9 sm:h-10 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
              </form>
            </div>
            <Button className="w-full h-9 sm:h-10 text-sm" onClick={handleForgotPassword} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Reset Link
            </Button>
            <button className="w-full text-xs sm:text-sm text-primary font-medium hover:underline" onClick={() => setMode("login")}>
              ← Back to sign in
            </button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }}>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Email</Label>
              <Input type="email" placeholder="you@example.com" className="h-9 sm:h-10 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm">Password</Label>
                {mode === "login" && (
                  <button className="text-[11px] sm:text-xs text-primary font-medium hover:underline" onClick={() => setMode("forgot")}>
                    Forgot password?
                  </button>
                )}
              </div>
              <Input type="password" placeholder="••••••••" className="h-9 sm:h-10 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full h-9 sm:h-10 text-sm" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "login" ? "Sign In" : "Sign Up"}
            </Button>
          </form>
        )}

        {mode !== "forgot" && (
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              className="text-primary font-medium hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        )}

        {DEV_BYPASS_ENABLED && (
          <div className="border-t border-dashed border-muted pt-3 mt-2">
            <p className="text-[10px] text-muted-foreground text-center mb-2 font-mono uppercase tracking-wider">Dev Quick Login</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { role: "superadmin" as UserRole, label: "Super Admin", color: "bg-red-500 hover:bg-red-600" },
                { role: "admin" as UserRole, label: "Admin", color: "bg-orange-500 hover:bg-orange-600" },
                { role: "business_owner" as UserRole, label: "Business Owner", color: "bg-blue-500 hover:bg-blue-600" },
                { role: "user" as UserRole, label: "Regular User", color: "bg-green-500 hover:bg-green-600" },
              ]).map(({ role, label, color }) => (
                <button
                  key={role}
                  onClick={() => { devLogin(role); onClose(); }}
                  className={`${color} text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
