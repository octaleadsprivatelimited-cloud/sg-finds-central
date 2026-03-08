import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oobCode");
    if (code) {
      setOobCode(code);
    }
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    if (!oobCode) {
      toast.error("Invalid or expired reset link");
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
        {success ? (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Password updated</h1>
            <p className="text-sm text-muted-foreground">Your password has been reset successfully. You can now sign in with your new password.</p>
            <Button className="w-full" onClick={() => navigate("/")}>
              Go to Directory
            </Button>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Set new password</h1>
              <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
            </div>

            {!oobCode && (
              <div className="text-center p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">Invalid or expired reset link</p>
                <p className="text-xs text-muted-foreground mt-1">Please request a new password reset from the sign-in page.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/")}>
                  Back to Directory
                </Button>
              </div>
            )}

            {oobCode && (
              <>
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="••••••••" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleReset} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Reset Password
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
