import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
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
import { ArrowLeft, ArrowRight, Check, Upload, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Business Details", "Contact Info", "Documents"];

const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [uen, setUen] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [description, setDescription] = useState("");

  // Step 2
  const [phone, setPhone] = useState("+65");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");

  // Step 3
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to add a listing");
      return;
    }
    setLoading(true);
    try {
      // Upload documents
      const documentsUrl: string[] = [];
      for (const file of files) {
        const storageRef = ref(storage, `documents/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        documentsUrl.push(url);
      }

      await addDoc(collection(db, "listings"), {
        name, uen, category, district, address, postalCode, description,
        phone, whatsapp, website, email,
        documentsUrl,
        status: "pending_approval",
        ownerId: user.uid,
        location: new GeoPoint(1.3521, 103.8198), // Default SG center
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
                <Label>Upload Documents</Label>
                <p className="text-sm text-muted-foreground">Upload ACRA Business Profile or Proof of Address (PDF, JPG, PNG)</p>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <label className="cursor-pointer">
                    <span className="text-primary font-medium hover:underline">Choose files</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, or PNG up to 10MB</p>
                </div>
                {files.length > 0 && (
                  <div className="space-y-1">
                    {files.map((f, i) => (
                      <p key={i} className="text-sm text-muted-foreground">📎 {f.name}</p>
                    ))}
                  </div>
                )}
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
      </div>
    </div>
  );
};

export default AddListing;
