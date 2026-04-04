import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  sendEmailVerification,
} from "firebase/auth";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

const SocialIcon = ({ name, loading }: { name: string; loading: boolean }) => {
  if (loading) return <Loader2 className="w-5 h-5 animate-spin shrink-0" />;
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
    case "apple":
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      );
    default: return null;
  }
};

const SignUp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // If user is logged in, redirect
  useEffect(() => {
    if (user) {
      navigate("/add-listing");
    }
  }, [user, navigate]);

  const handleEmailSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user, {
        url: window.location.origin,
      });
      await auth.signOut();
      toast.success("Account created! Please check your email to verify your account before signing in.");
      navigate("/");
    } catch (err: any) {
      const code = err?.code || "";
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/weak-password": "Password is too weak. Use at least 6 characters.",
        "auth/invalid-email": "Please enter a valid email address.",
      };
      toast.error(messages[code] || err.message || "Sign up failed");
    }
    setLoading(false);
  };

  const handleSocialSignUp = async (providerName: string) => {
    setSocialLoading(providerName);
    try {
      const provider = providerName === "google" ? googleProvider : appleProvider;
      await signInWithPopup(auth, provider);
      toast.success("Account created successfully!");
      navigate("/add-listing");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || `${providerName} sign-up failed`);
      }
    }
    setSocialLoading(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Professional gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="container mx-auto px-3 py-3 md:py-10 max-w-md relative z-10">
        <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-4 md:p-8 shadow-lg animate-fade-in">
          {/* Header */}
          <div className="text-center mb-4 md:mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary/10 mb-2 md:mb-3">
              <UserPlus className="w-5 h-5 md:w-7 md:h-7 text-primary" />
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-foreground">Get Started Free</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              List your business in seconds
            </p>
          </div>

          {/* Social Sign-Up */}
          <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
            {(["google", "apple"] as const).map((provider) => (
              <Button
                key={provider}
                variant="outline"
                className="h-9 md:h-11 rounded-xl"
                onClick={() => handleSocialSignUp(provider)}
                disabled={!!socialLoading}
                title={`Sign up with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
              >
                <SocialIcon name={provider} loading={socialLoading === provider} />
                <span className="ml-2 capitalize">{provider}</span>
              </Button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative my-3 md:my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              or sign up with email
            </span>
          </div>

          {/* Email Sign Up */}
          <form className="space-y-2 md:space-y-3" onSubmit={(e) => { e.preventDefault(); handleEmailSignUp(); }}>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="h-9 md:h-10 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Password</Label>
              <Input
                type="password"
                placeholder="Min. 6 characters"
                className="h-9 md:h-10 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Confirm Password</Label>
              <Input
                type="password"
                placeholder="Re-enter your password"
                className="h-9 md:h-10 text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-9 md:h-10" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground mt-3 md:mt-4">
            A verification link will be sent to your email
          </p>

          {/* Already have account */}
          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border">
            Already have an account?{" "}
            <button className="text-primary font-medium hover:underline" onClick={() => navigate("/")}>
              Sign in
            </button>
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">🔒 Secure</span>
          <span className="flex items-center gap-1">⚡ Free forever</span>
          <span className="flex items-center gap-1">🇸🇬 Singapore</span>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
