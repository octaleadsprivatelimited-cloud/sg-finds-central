import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, GeoPoint, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import AIContentGenerator from "@/components/AIContentGenerator";
import LogoUpload from "@/components/LogoUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SINGAPORE_DISTRICTS, BUSINESS_CATEGORIES } from "@/lib/districts";
import { ArrowLeft, ArrowRight, Check, Link2, Loader2, Building2, Plus, X, Gift } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Business Details", "Contact Info", "Documents"];

const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasExistingListing, setHasExistingListing] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Check if user already has a listing
  useEffect(() => {
    const checkExisting = async () => {
      if (!user) {
        setCheckingExisting(false);
        return;
      }
      try {
        const q = query(collection(db, "listings"), where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        setHasExistingListing(!snap.empty);
      } catch {
        // Allow submission if check fails
      }
      setCheckingExisting(false);
    };
    checkExisting();
  }, [user]);

  // Step 1
  const [name, setName] = useState("");
  const [uen, setUen] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Step 2
  const [phone, setPhone] = useState("+65");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");

  // Step 3 - Document links
  const [docLinks, setDocLinks] = useState<string[]>([""]);

  const ALLOWED_DOMAINS = [
    "drive.google.com", "docs.google.com", "storage.googleapis.com",
    "dropbox.com", "www.dropbox.com", "dl.dropboxusercontent.com",
    "onedrive.live.com", "1drv.ms", "sharepoint.com",
    "icloud.com", "www.icloud.com",
  ];

  const isValidCloudLink = (url: string): boolean => {
    if (!url.trim()) return true; // empty is ok
    try {
      const parsed = new URL(url.trim());
      return ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith("." + d));
    } catch {
      return false;
    }
  };

  const getProviderLabel = (url: string): string => {
    try {
      const h = new URL(url.trim()).hostname;
      if (h.includes("google")) return "Google Drive";
      if (h.includes("dropbox")) return "Dropbox";
      if (h.includes("onedrive") || h.includes("1drv") || h.includes("sharepoint")) return "OneDrive";
      if (h.includes("icloud")) return "iCloud";
    } catch {}
    return "";
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to add a listing");
      return;
    }

    if (hasExistingListing) {
      toast.error("You can only register one business per account");
      return;
    }

    const validLinks = docLinks.filter(l => l.trim() !== "");
    const invalidLinks = validLinks.filter(l => !isValidCloudLink(l));
    if (invalidLinks.length > 0) {
      toast.error("Only Google Drive, Dropbox, OneDrive, or iCloud links are allowed");
      return;
    }

    // Check for duplicate email
    if (email.trim()) {
      try {
        const emailQ = query(collection(db, "listings"), where("email", "==", email.trim()));
        const emailSnap = await getDocs(emailQ);
        if (!emailSnap.empty) {
          toast.error("A business with this email is already registered");
          return;
        }
      } catch {}
    }

    // Check for duplicate phone
    if (phone.trim() && phone.trim() !== "+65") {
      try {
        const phoneQ = query(collection(db, "listings"), where("phone", "==", phone.trim()));
        const phoneSnap = await getDocs(phoneQ);
        if (!phoneSnap.empty) {
          toast.error("A business with this phone number is already registered");
          return;
        }
      } catch {}
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "listings"), {
        name, uen, category, district, address, postalCode, description,
        phone, whatsapp, website, email, logoUrl,
        documentsUrl: validLinks,
        status: "pending_approval",
        ownerId: user.uid,
        location: new GeoPoint(1.3521, 103.8198),
        createdAt: serverTimestamp(),
      });

      toast.success("Listing submitted for approval!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit listing");
    }
    setLoading(false);
  };

  const canProceed = () => {
    if (step === 0) return name && uen && category && district && address && postalCode;
    if (step === 1) return phone;
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Directory
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Add Your Business</h1>
          <p className="text-muted-foreground mt-1">List your business in the Singapore Directory</p>
        </div>

        {checkingExisting ? (
          <div className="text-center py-16">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Checking account status...</p>
          </div>
        ) : hasExistingListing ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">One Business Per Account</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Each account can only register one business. You already have a listing registered with this account.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Back to Directory
              </Button>
            </div>
          </div>
        ) : (
        <>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground" :
                "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              {/* Logo Upload */}
              {user && (
                <div className="pb-4 border-b border-border">
                  <LogoUpload
                    currentUrl={logoUrl || undefined}
                    userId={user.uid}
                    onUploaded={(url) => setLogoUrl(url)}
                    onRemoved={() => setLogoUrl("")}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Business Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Singapore Delights Pte Ltd" />
                </div>
                <div className="space-y-2">
                  <Label>UEN *</Label>
                  <Input value={uen} onChange={(e) => setUen(e.target.value)} placeholder="e.g. 201912345A" />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.filter(c => c !== "All Categories").map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      {SINGAPORE_DISTRICTS.filter(d => d !== "All Districts").map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Postal Code *</Label>
                  <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. 238872" maxLength={6} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address *</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 391 Orchard Road, #B2-01" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe your business..." rows={3} />
                </div>
                {name && category && district && (
                  <div className="sm:col-span-2 border border-border rounded-xl p-4">
                    <AIContentGenerator
                      businessName={name}
                      category={category}
                      district={district}
                      onGenerated={(content) => setDescription(content)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+65 6234 5678" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+65 9123 4567" />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@yourbusiness.com" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Document Links</Label>
                <p className="text-sm text-muted-foreground">
                  Share public URLs from <strong>Google Drive</strong>, <strong>Dropbox</strong>, <strong>OneDrive</strong>, or <strong>iCloud</strong> (ACRA profile, proof of address, etc.)
                </p>
              </div>

              <div className="space-y-3">
                {docLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={link}
                          onChange={(e) => {
                            const updated = [...docLinks];
                            updated[i] = e.target.value;
                            setDocLinks(updated);
                          }}
                          placeholder="https://drive.google.com/file/d/..."
                          className={`pl-10 ${link && !isValidCloudLink(link) ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                      </div>
                      {link && !isValidCloudLink(link) && (
                        <p className="text-xs text-destructive">Only Google Drive, Dropbox, OneDrive, or iCloud links are accepted</p>
                      )}
                      {link && isValidCloudLink(link) && getProviderLabel(link) && (
                        <p className="text-xs text-muted-foreground">✓ {getProviderLabel(link)}</p>
                      )}
                    </div>
                    {docLinks.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDocLinks(docLinks.filter((_, j) => j !== i))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {docLinks.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDocLinks([...docLinks, ""])}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add another link
                </Button>
              )}

              <div className="rounded-xl bg-secondary/50 p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm">Supported cloud providers:</p>
                <p>• Google Drive — drive.google.com</p>
                <p>• Dropbox — dropbox.com</p>
                <p>• Microsoft OneDrive — onedrive.live.com</p>
                <p>• Apple iCloud — icloud.com</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Listing
              </Button>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default AddListing;
