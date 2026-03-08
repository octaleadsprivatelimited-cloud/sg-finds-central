import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { Mail, Phone, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone" | "whatsapp";

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
    case "whatsapp":
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      );
    default: return null;
  }
};

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+65");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Signed in successfully");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    }
    setLoading(false);
  };

  const handleSocialSignIn = async (providerName: string) => {
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
      toast.success(`Signed in with ${providerName.charAt(0).toUpperCase() + providerName.slice(1)}`);
      onClose();
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || `${providerName} sign-in failed`);
      }
    }
    setSocialLoading(null);
  };

  const handleSendOTP = async (viaWhatsApp = false) => {
    setLoading(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      setConfirmResult(result);
      toast.success(`OTP sent to ${phone}${viaWhatsApp ? " via WhatsApp" : ""}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!confirmResult) return;
    setLoading(true);
    try {
      await confirmResult.confirm(otp);
      toast.success("Phone verified successfully");
      onClose();
    } catch (err: any) {
      toast.error("Invalid OTP");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md gap-3">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {mode === "login" ? "Welcome back" : "Create account"}
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Sign in to manage your business listings</p>
        </DialogHeader>

        {/* Social Sign-In — icon-only row */}
        <div className="flex gap-3 justify-center">
          {(["google", "apple", "microsoft", "whatsapp"] as const).map((provider) => (
            <Button
              key={provider}
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl"
              onClick={() =>
                provider === "whatsapp"
                  ? (() => { setMethod("whatsapp"); setConfirmResult(null); })()
                  : handleSocialSignIn(provider)
              }
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

        {/* Method Toggle */}
        <div className="flex gap-2">
          <Button
            variant={method === "email" ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs sm:text-sm"
            onClick={() => { setMethod("email"); setConfirmResult(null); }}
          >
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Email
          </Button>
          <Button
            variant={method === "phone" ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs sm:text-sm"
            onClick={() => { setMethod("phone"); setConfirmResult(null); }}
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Mobile OTP
          </Button>
        </div>

        {method === "email" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Email</Label>
              <Input type="email" placeholder="you@example.com" className="h-9 sm:h-10 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Password</Label>
              <Input type="password" placeholder="••••••••" className="h-9 sm:h-10 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="w-full h-9 sm:h-10 text-sm" onClick={handleEmailAuth} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "login" ? "Sign In" : "Sign Up"}
            </Button>
          </div>
        ) : (method === "phone" || method === "whatsapp") ? (
          <div className="space-y-3">
            {!confirmResult ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">
                    {method === "whatsapp" ? "WhatsApp Number" : "Singapore Mobile Number"}
                  </Label>
                  <div className="relative">
                    {method === "whatsapp" && (
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}
                    <Input
                      type="tel"
                      placeholder="+65 9123 4567"
                      className={`h-9 sm:h-10 text-sm ${method === "whatsapp" ? "pl-10" : ""}`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  {method === "whatsapp" && (
                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                      We'll send an OTP via SMS to verify your WhatsApp number
                    </p>
                  )}
                </div>
                <Button className="w-full h-9 sm:h-10 text-sm" onClick={() => handleSendOTP(method === "whatsapp")} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Enter OTP</Label>
                  <Input type="text" placeholder="123456" className="h-9 sm:h-10 text-sm" value={otp} maxLength={6} onChange={(e) => setOtp(e.target.value)} />
                </div>
                <Button className="w-full h-9 sm:h-10 text-sm" onClick={handleVerifyOTP} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verify OTP
                </Button>
              </>
            )}
            <div id="recaptcha-container" />
          </div>
        ) : null}

        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            className="text-primary font-medium hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
