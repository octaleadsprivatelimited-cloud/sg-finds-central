import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { Loader2, Store, Shield, Zap } from "lucide-react";
import { toast } from "sonner";
import signupIllustration from "@/assets/signup-illustration.png";
import { useGoogleOneTap } from "@/hooks/useGoogleOneTap";

const googleProvider = new GoogleAuthProvider();

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const SignUp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/add-listing");
  }, [user, navigate]);

  // Google One Tap — auto sign-in prompt
  useGoogleOneTap({
    disabled: !!user,
    onSuccess: () => navigate("/add-listing"),
  });

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
      if (phone.trim()) {
        await setDoc(doc(db, "users", result.user.uid), {
          email,
          phone: phone.trim(),
          createdAt: serverTimestamp(),
        });
      }
      await sendEmailVerification(result.user, { url: window.location.origin });
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

  const handleGoogleSignUp = async () => {
    setSocialLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Account created successfully!");
      navigate("/add-listing");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || "Google sign-up failed");
      }
    }
    setSocialLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Illustration (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/[0.03] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 max-w-lg text-center space-y-8">
          <img
            src={signupIllustration}
            alt="Business registration illustration"
            width={400}
            height={300}
            className="mx-auto drop-shadow-sm"
          />
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Grow your business locally
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Join hundreds of Singapore businesses already reaching more customers through FindLocal.
            </p>
          </div>
          <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> UEN Verified</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Free Forever</span>
            <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Local Focus</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[400px] space-y-6 animate-fade-in">
          {/* Mobile illustration */}
          <div className="lg:hidden flex justify-center">
            <img
              src={signupIllustration}
              alt="Business registration"
              width={200}
              height={150}
              className="drop-shadow-sm"
            />
          </div>

          {/* Header */}
          <div className="text-center lg:text-left space-y-1">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground">
              List your business for free in seconds
            </p>
          </div>

          {/* Google Sign-Up */}
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl border-border text-sm font-medium"
            onClick={handleGoogleSignUp}
            disabled={socialLoading}
          >
            {socialLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <GoogleIcon />}
            <span className="ml-2">Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or
            </span>
          </div>

          {/* Email Form */}
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleEmailSignUp(); }}>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="h-10 rounded-lg text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Mobile Number</Label>
              <Input
                type="tel"
                placeholder="+65 XXXX XXXX"
                className="h-10 rounded-lg text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Password</Label>
                <Input
                  type="password"
                  placeholder="Min. 6 chars"
                  className="h-10 rounded-lg text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Confirm</Label>
                <Input
                  type="password"
                  placeholder="Re-enter"
                  className="h-10 rounded-lg text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-10 rounded-lg text-sm font-medium" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground">
            A verification link will be sent to your email
          </p>

          {/* Sign in link */}
          <p className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
            Already have an account?{" "}
            <button className="text-primary font-medium hover:underline" onClick={() => navigate("/")}>
              Sign in
            </button>
          </p>

          {/* Trust badges (mobile) */}
          <div className="lg:hidden flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Free</span>
            <span className="flex items-center gap-1">🇸🇬 Singapore</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
