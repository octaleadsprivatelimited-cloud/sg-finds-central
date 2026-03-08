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
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithCredential,
  PhoneAuthProvider,
  ConfirmationResult,
  deleteUser,
} from "firebase/auth";
import { Mail, Phone, Loader2, MessageCircle, ArrowLeft, UserPlus, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.addScope("user.read");

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
    case "microsoft":
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
          <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
          <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
          <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
        </svg>
      );
    default: return null;
  }
};

const BUSINESS_EMOJIS = [
  "🏪", "🍕", "💈", "🏥", "🎓", "💻", "🏠", "🚗", "⚖️", "📦",
  "🎉", "🔧", "📸", "🐾", "🏋️", "✈️", "🧹", "💰", "🏗️", "🛍️",
  "🍜", "💼", "🎨", "🏦", "🌿", "☕", "🎵", "🔬", "🛒", "🏨",
];

// Step 1 = collect credentials, Step 2 = verify phone OTP
type SignUpStep = "credentials" | "phone-verify";
type SignUpMethod = "email" | "social";

const SignUp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step tracking
  const [step, setStep] = useState<SignUpStep>("credentials");
  const [signUpMethod, setSignUpMethod] = useState<SignUpMethod>("email");

  // Step 1 — email fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 — phone OTP
  const [phone, setPhone] = useState("+65");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // If user is fully verified, redirect
  useEffect(() => {
    if (user && phoneVerified) {
      navigate("/add-listing");
    }
  }, [user, phoneVerified, navigate]);

  // ── Step 1: Email sign-up → move to phone verify ──
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
      await createUserWithEmailAndPassword(auth, email, password);
      setSignUpMethod("email");
      setStep("phone-verify");
      toast.success("Email registered! Now verify your phone number.");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    }
    setLoading(false);
  };

  // ── Step 1: Social sign-up → move to phone verify ──
  const handleSocialSignUp = async (providerName: string) => {
    setSocialLoading(providerName);
    try {
      let provider;
      switch (providerName) {
        case "google": provider = googleProvider; break;
        case "apple": provider = appleProvider; break;
        case "microsoft": provider = microsoftProvider; break;
        default: return;
      }
      await signInWithPopup(auth, provider);
      setSignUpMethod("social");
      setStep("phone-verify");
      toast.success("Signed in! Now verify your phone number.");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || `${providerName} sign-up failed`);
      }
    }
    setSocialLoading(null);
  };

  // ── Step 2: Send phone OTP ──
  const handleSendOTP = async () => {
    // Validate Singapore number: must start with +65 and have 8 digits after
    const cleaned = phone.replace(/\s/g, "");
    const sgRegex = /^\+65[689]\d{7}$/;
    if (!sgRegex.test(cleaned)) {
      toast.error("Please enter a valid Singapore mobile number (+65 8/9xxx xxxx)");
      return;
    }
    setLoading(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      setConfirmResult(result);
      setResendTimer(60);
      toast.success(`OTP sent to ${phone}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    }
    setLoading(false);
  };

  // ── Step 2: Verify OTP and link phone to account ──
  const handleVerifyOTP = async () => {
    if (!confirmResult || !otp.trim()) return;
    setLoading(true);
    try {
      // Verify the OTP
      const credential = PhoneAuthProvider.credential(confirmResult.verificationId, otp);

      // Try to link phone to existing account
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await linkWithCredential(currentUser, credential);
        } catch (linkErr: any) {
          // If already linked or provider exists, that's fine
          if (linkErr.code !== "auth/provider-already-linked" && linkErr.code !== "auth/credential-already-in-use") {
            throw linkErr;
          }
        }
      } else {
        // Fallback: confirm directly (creates phone-only account)
        await confirmResult.confirm(otp);
      }

      setPhoneVerified(true);
      toast.success("Phone verified! Account created successfully.");
      navigate("/add-listing");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP — please try again");
    }
    setLoading(false);
  };

  // ── Cancel: delete partially-created account ──
  const handleCancel = async () => {
    const currentUser = auth.currentUser;
    if (currentUser && !phoneVerified) {
      try {
        await deleteUser(currentUser);
      } catch {
        // User may need to re-auth to delete — just sign out
        await auth.signOut();
      }
    }
    setStep("credentials");
    setConfirmResult(null);
    setOtp("");
    setPhone("+65");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Emoji grid background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="grid grid-cols-6 md:grid-cols-8 gap-10 md:gap-14 p-6 md:p-10 opacity-[0.05]">
          {BUSINESS_EMOJIS.concat(BUSINESS_EMOJIS.slice(0, 18)).map((emoji, i) => (
            <span
              key={i}
              className="text-3xl md:text-4xl select-none text-center"
              style={{ transform: `rotate(${(i * 23) % 40 - 20}deg)` }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-10 max-w-md relative z-10">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => step === "credentials" ? navigate("/") : handleCancel()}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {step === "credentials" ? "Back to Directory" : "Back"}
        </Button>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === "credentials" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === "phone-verify" ? "bg-primary text-primary-foreground" : step === "credentials" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {step === "phone-verify" ? <CheckCircle2 className="w-4 h-4" /> : "1"}
            </div>
            <span className="hidden sm:inline">Account</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === "phone-verify" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === "phone-verify" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              2
            </div>
            <span className="hidden sm:inline">Verify Phone</span>
          </div>
        </div>

        {/* ═══ STEP 1: CREDENTIALS ═══ */}
        {step === "credentials" && (
          <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-6 md:p-8 shadow-lg animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
                <UserPlus className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Create Your Account</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sign up to list your business for free
              </p>
            </div>

            {/* Social Sign-Up */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {(["google", "apple", "microsoft"] as const).map((provider) => (
                <Button
                  key={provider}
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => handleSocialSignUp(provider)}
                  disabled={!!socialLoading}
                  title={`Sign up with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
                >
                  <SocialIcon name={provider} loading={socialLoading === provider} />
                </Button>
              ))}
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                or sign up with email
              </span>
            </div>

            {/* Email Sign Up */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-10 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Password</Label>
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  className="h-10 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Re-enter your password"
                  className="h-10 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button className="w-full h-10" onClick={handleEmailSignUp} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Continue
              </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground mt-4">
              You'll need to verify your mobile number in the next step
            </p>

            {/* Already have account */}
            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
              Already have an account?{" "}
              <button className="text-primary font-medium hover:underline" onClick={() => navigate("/")}>
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* ═══ STEP 2: PHONE VERIFICATION ═══ */}
        {step === "phone-verify" && (
          <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-6 md:p-8 shadow-lg animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Verify Your Phone</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your mobile number to receive a verification code
              </p>
            </div>

            {!confirmResult ? (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Singapore Mobile Number</Label>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center h-10 px-3 rounded-md border border-border bg-secondary/50 text-sm font-medium text-muted-foreground shrink-0">
                      🇸🇬 +65
                    </span>
                    <Input
                      type="tel"
                      placeholder="9123 4567"
                      className="h-10 text-sm"
                      value={phone.replace(/^\+65\s?/, "")}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                        setPhone(`+65${digits}`);
                      }}
                      maxLength={9}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Only Singapore numbers (+65) are accepted
                  </p>
                </div>
                <Button className="w-full h-10" onClick={handleSendOTP} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Phone className="w-4 h-4 mr-1.5" />
                  Send OTP
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    OTP sent to <span className="font-semibold text-foreground">{phone}</span>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Enter 6-digit OTP</Label>
                  <Input
                    type="text"
                    placeholder="123456"
                    className="h-12 text-center text-lg font-mono tracking-[0.5em]"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                  />
                </div>
                <Button className="w-full h-10" onClick={handleVerifyOTP} disabled={loading || otp.length < 6}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verify & Create Account
                </Button>
                <button
                  className={`w-full text-xs transition-colors ${resendTimer > 0 ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground hover:text-primary"}`}
                  onClick={() => { if (resendTimer <= 0) { setConfirmResult(null); setOtp(""); } }}
                  disabled={resendTimer > 0}
                >
                  {resendTimer > 0
                    ? `Resend OTP in ${resendTimer}s`
                    : "Didn't receive OTP? Resend"}
                </button>
              </div>
            )}

            <div id="recaptcha-container" />
          </div>
        )}

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
