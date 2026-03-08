import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { Mail, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+65");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      setConfirmResult(result);
      toast.success("OTP sent to " + phone);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === "login" ? "Welcome back" : "Create account"}
          </DialogTitle>
        </DialogHeader>

        {/* Method Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={method === "email" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => { setMethod("email"); setConfirmResult(null); }}
          >
            <Mail className="w-4 h-4 mr-1.5" />
            Email
          </Button>
          <Button
            variant={method === "phone" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setMethod("phone")}
          >
            <Phone className="w-4 h-4 mr-1.5" />
            Mobile
          </Button>
        </div>

        {method === "email" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleEmailAuth} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "login" ? "Sign In" : "Sign Up"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {!confirmResult ? (
              <>
                <div className="space-y-2">
                  <Label>Singapore Mobile Number</Label>
                  <Input
                    type="tel"
                    placeholder="+65 9123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleSendOTP} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Enter OTP</Label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleVerifyOTP} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verify OTP
                </Button>
              </>
            )}
            <div id="recaptcha-container" />
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
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
