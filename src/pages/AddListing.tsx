import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, GeoPoint, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

import LogoUpload from "@/components/LogoUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SINGAPORE_DISTRICTS, BUSINESS_CATEGORIES } from "@/lib/districts";
import {
  needsSubcategoryScreen, needsComplianceScreen, getComplianceGates,
  TUITION_SUBJECTS, TUITION_LANGUAGES, TUITION_LEVELS, TUITION_SYLLABI,
  MUSIC_ART_CRAFT_SUBS, BEAUTY_SUBS, PET_SUBS, HANDYMAN_SUBS,
  SERVICE_LOCATIONS, CONTACT_METHODS,
  type MultiSelectOption,
} from "@/lib/listing-form-config";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Building2, X,
  MapPin, FileText, Phone, Image, ShieldCheck, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

/* ── Reusable multi-select chip component ── */
const ChipSelect = ({
  options, selected, onChange, allowOther = false, otherValue = "", onOtherChange,
}: {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (v: string[]) => void;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}) => (
  <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? selected.filter(v => v !== opt.value) : [...selected, opt.value])}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
    {allowOther && (
      <Input
        placeholder="Other (type here)"
        value={otherValue}
        onChange={(e) => onOtherChange?.(e.target.value)}
        className="max-w-xs"
      />
    )}
  </div>
);

/* ── Single-select chip ── */
const SingleChipSelect = ({
  options, selected, onChange, allowOther = false, otherValue = "", onOtherChange,
}: {
  options: MultiSelectOption[];
  selected: string;
  onChange: (v: string) => void;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}) => (
  <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selected === opt.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border hover:border-primary/40"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
    {allowOther && (
      <Input
        placeholder="Other (type here)"
        value={otherValue}
        onChange={(e) => onOtherChange?.(e.target.value)}
        className="max-w-xs"
      />
    )}
  </div>
);

/* ── Step definitions ── */
const getSteps = (category: string, serviceLocations: string[]) => {
  const steps: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "category", label: "Category", icon: <Building2 className="w-4 h-4" /> },
    { key: "details", label: "Business Details", icon: <FileText className="w-4 h-4" /> },
  ];
  if (needsSubcategoryScreen(category)) {
    steps.push({ key: "subcategory", label: "Subcategory", icon: <FileText className="w-4 h-4" /> });
  }
  steps.push(
    { key: "service-location", label: "Service Location", icon: <MapPin className="w-4 h-4" /> },
    { key: "address", label: "Location", icon: <MapPin className="w-4 h-4" /> },
    { key: "story", label: "Our Story", icon: <FileText className="w-4 h-4" /> },
    { key: "profile", label: "Profile Extras", icon: <Image className="w-4 h-4" /> },
  );
  if (needsComplianceScreen(category, serviceLocations)) {
    steps.push({ key: "compliance", label: "Compliance", icon: <ShieldCheck className="w-4 h-4" /> });
  }
  steps.push({ key: "contact", label: "Contact", icon: <MessageCircle className="w-4 h-4" /> });
  return steps;
};

const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasExistingListing, setHasExistingListing] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // ── Screen 1: Category ──
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");

  // ── Screen 2: Business Details ──
  const [name, setName] = useState("");
  const [uen, setUen] = useState("");

  // ── Screen 3: Subcategory data ──
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsOther, setSubjectsOther] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [languagesOther, setLanguagesOther] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [levelsOther, setLevelsOther] = useState("");
  const [syllabi, setSyllabi] = useState<string[]>([]);
  const [syllabiOther, setSyllabiOther] = useState("");
  const [musicArtSub, setMusicArtSub] = useState("");
  const [musicArtOther, setMusicArtOther] = useState("");
  const [beautySubs, setBeautySubs] = useState<string[]>([]);
  const [beautyOther, setBeautyOther] = useState("");
  const [petSubs, setPetSubs] = useState<string[]>([]);
  const [petOther, setPetOther] = useState("");
  const [handymanSubs, setHandymanSubs] = useState<string[]>([]);
  const [handymanOther, setHandymanOther] = useState("");

  // ── Screen 4: Service location ──
  const [serviceLocations, setServiceLocations] = useState<string[]>([]);
  const [travelArea, setTravelArea] = useState("");

  // ── Screen 5: Address ──
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [unitNumber, setUnitNumber] = useState("");

  // ── Screen 6: Story ──
  const [story, setStory] = useState("");

  // ── Screen 7: Profile extras ──
  const [logoUrl, setLogoUrl] = useState("");
  const [shortDescriptor, setShortDescriptor] = useState("");

  // ── Screen 8: Compliance ──
  const [complianceChecks, setComplianceChecks] = useState<Record<string, boolean>>({});

  // ── Screen 9: Contact ──
  const [primaryContact, setPrimaryContact] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("+65");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [secondaryContact, setSecondaryContact] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");

  // Derived
  const steps = getSteps(category, serviceLocations);
  const currentStep = steps[stepIndex];

  useEffect(() => {
    const checkExisting = async () => {
      if (!user) { setCheckingExisting(false); return; }
      try {
        const q = query(collection(db, "listings"), where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        setHasExistingListing(!snap.empty);
      } catch {}
      setCheckingExisting(false);
    };
    checkExisting();
  }, [user]);

  useEffect(() => {
    if (!user && !checkingExisting) navigate("/signup");
  }, [user, checkingExisting, navigate]);

  // Clamp stepIndex if steps shrink
  useEffect(() => {
    if (stepIndex >= steps.length) setStepIndex(steps.length - 1);
  }, [steps.length, stepIndex]);

  const canProceed = (): boolean => {
    if (!currentStep) return false;
    switch (currentStep.key) {
      case "category": return !!category && !!district;
      case "details": return !!name && !!uen;
      case "subcategory":
        if (category === "Tuition") return subjects.length > 0 && levels.length > 0 && syllabi.length > 0;
        if (category === "Music / Art / Craft") return !!musicArtSub || !!musicArtOther;
        if (category === "Beauty") return beautySubs.length > 0 || !!beautyOther;
        if (category === "Pet Services") return petSubs.length > 0 || !!petOther;
        if (category === "Handyman") return handymanSubs.length > 0 || !!handymanOther;
        return true;
      case "service-location": return serviceLocations.length > 0;
      case "address": return !!address && !!postalCode;
      case "story": return !!story.trim();
      case "profile": return true; // optional
      case "compliance": {
        const gates = getComplianceGates(category, serviceLocations);
        return gates.every(g => complianceChecks[g.id] === true);
      }
      case "contact":
        if (!primaryContact) return false;
        if (primaryContact === "whatsapp" && (!whatsappNumber || whatsappNumber === "+65")) return false;
        if (primaryContact === "instagram" && !instagramHandle) return false;
        if (primaryContact === "website" && !websiteUrl) return false;
        return true;
      default: return true;
    }
  };

  const buildSubcategoryData = () => {
    if (category === "Tuition") {
      return {
        subjects: [...subjects, ...(subjectsOther ? [subjectsOther] : [])],
        languages: [...languages, ...(languagesOther ? [languagesOther] : [])],
        levels: [...levels, ...(levelsOther ? [levelsOther] : [])],
        syllabi: [...syllabi, ...(syllabiOther ? [syllabiOther] : [])],
      };
    }
    if (category === "Music / Art / Craft") return { subcategory: musicArtOther || musicArtSub };
    if (category === "Beauty") return { subcategories: [...beautySubs, ...(beautyOther ? [beautyOther] : [])] };
    if (category === "Pet Services") return { subcategories: [...petSubs, ...(petOther ? [petOther] : [])] };
    if (category === "Handyman") return { subcategories: [...handymanSubs, ...(handymanOther ? [handymanOther] : [])] };
    return {};
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (hasExistingListing) { toast.error("One business per account"); return; }

    setLoading(true);
    try {
      await addDoc(collection(db, "listings"), {
        name, uen, category, district, address, postalCode, unitNumber,
        description: story,
        logoUrl, shortDescriptor,
        serviceLocations,
        travelArea: serviceLocations.includes("at-customer-home") ? travelArea : "",
        subcategoryData: buildSubcategoryData(),
        complianceChecks,
        primaryContact,
        contactDetails: {
          whatsapp: primaryContact === "whatsapp" ? whatsappNumber : "",
          whatsappMessage: primaryContact === "whatsapp" ? whatsappMessage : "",
          instagram: primaryContact === "instagram" ? instagramHandle : "",
          website: primaryContact === "website" ? websiteUrl : "",
          secondary: secondaryContact ? { method: secondaryContact, value: secondaryValue } : null,
        },
        status: "pending_approval",
        ownerId: user.uid,
        location: new GeoPoint(1.3521, 103.8198),
        createdAt: serverTimestamp(),
      });
      toast.success("Listing submitted for approval!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    }
    setLoading(false);
  };

  const isLastStep = stepIndex === steps.length - 1;

  /* ────────── RENDER ────────── */
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Directory
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Add Your Business</h1>
          <p className="text-muted-foreground mt-1">List your home-based business in Singapore</p>
        </div>

        {checkingExisting ? (
          <div className="text-center py-16">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Checking account status...</p>
          </div>
        ) : hasExistingListing ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">One Business Per Account</h2>
            <p className="text-sm text-muted-foreground mb-6">You already have a listing registered.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
              <Button variant="outline" onClick={() => navigate("/")}>Back to Directory</Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Step indicator ── */}
            <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors shrink-0 ${
                    i < stepIndex ? "bg-primary text-primary-foreground" :
                    i === stepIndex ? "bg-primary text-primary-foreground" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {i < stepIndex ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
                </div>
              ))}
            </div>

            {/* ── Form card ── */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">

              {/* SCREEN 1: Category */}
              {currentStep?.key === "category" && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">What do you do?</h2>
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
                </div>
              )}

              {/* SCREEN 2: Business Details */}
              {currentStep?.key === "details" && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Business Details</h2>
                  <div className="space-y-2">
                    <Label>Business Name *</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mary's Tuition Centre" />
                  </div>
                  <div className="space-y-2">
                    <Label>UEN *</Label>
                    <Input value={uen} onChange={e => setUen(e.target.value)} placeholder="e.g. 201912345A" />
                  </div>
                </div>
              )}

              {/* SCREEN 3: Subcategory (conditional) */}
              {currentStep?.key === "subcategory" && (
                <div className="space-y-5 animate-fade-in">
                  {category === "Tuition" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Tuition Profile</h2>
                      <div className="space-y-2">
                        <Label>Subjects taught *</Label>
                        <ChipSelect options={TUITION_SUBJECTS} selected={subjects} onChange={setSubjects} allowOther otherValue={subjectsOther} onOtherChange={setSubjectsOther} />
                      </div>
                      <div className="space-y-2">
                        <Label>Languages</Label>
                        <ChipSelect options={TUITION_LANGUAGES} selected={languages} onChange={setLanguages} allowOther otherValue={languagesOther} onOtherChange={setLanguagesOther} />
                      </div>
                      <div className="space-y-2">
                        <Label>Levels supported *</Label>
                        <ChipSelect options={TUITION_LEVELS} selected={levels} onChange={setLevels} allowOther otherValue={levelsOther} onOtherChange={setLevelsOther} />
                      </div>
                      <div className="space-y-2">
                        <Label>Syllabus supported *</Label>
                        <ChipSelect options={TUITION_SYLLABI} selected={syllabi} onChange={setSyllabi} allowOther otherValue={syllabiOther} onOtherChange={setSyllabiOther} />
                      </div>
                    </>
                  )}

                  {category === "Music / Art / Craft" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Subcategory</h2>
                      <div className="space-y-2">
                        <Label>Select one *</Label>
                        <SingleChipSelect options={MUSIC_ART_CRAFT_SUBS} selected={musicArtSub} onChange={setMusicArtSub} allowOther otherValue={musicArtOther} onOtherChange={setMusicArtOther} />
                      </div>
                    </>
                  )}

                  {category === "Beauty" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Beauty Services</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={BEAUTY_SUBS} selected={beautySubs} onChange={setBeautySubs} allowOther otherValue={beautyOther} onOtherChange={setBeautyOther} />
                      </div>
                    </>
                  )}

                  {category === "Pet Services" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Pet Services</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={PET_SUBS} selected={petSubs} onChange={setPetSubs} allowOther otherValue={petOther} onOtherChange={setPetOther} />
                      </div>
                    </>
                  )}

                  {category === "Handyman" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Handyman Services</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={HANDYMAN_SUBS} selected={handymanSubs} onChange={setHandymanSubs} allowOther otherValue={handymanOther} onOtherChange={setHandymanOther} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SCREEN 4: Service Location */}
              {currentStep?.key === "service-location" && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Where does your service happen?</h2>
                  <ChipSelect options={SERVICE_LOCATIONS} selected={serviceLocations} onChange={setServiceLocations} />
                  {serviceLocations.includes("at-customer-home") && (
                    <div className="space-y-2 pt-2">
                      <Label>Travel area (optional)</Label>
                      <Input value={travelArea} onChange={e => setTravelArea(e.target.value)} placeholder="e.g. Within 10km of Tampines" />
                    </div>
                  )}
                </div>
              )}

              {/* SCREEN 5: Location */}
              {currentStep?.key === "address" && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Your Location</h2>
                  <div className="space-y-2">
                    <Label>Address *</Label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 391 Orchard Road, #B2-01" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Postal Code *</Label>
                      <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="e.g. 238872" maxLength={6} />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Number (private)</Label>
                      <Input value={unitNumber} onChange={e => setUnitNumber(e.target.value)} placeholder="e.g. #12-345" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Unit number is kept private and won't be shown publicly.</p>
                </div>
              )}

              {/* SCREEN 6: Our Story */}
              {currentStep?.key === "story" && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Our Story</h2>
                  <p className="text-sm text-muted-foreground">Tell customers about yourself, your experience, and what makes you special.</p>
                  <Textarea
                    value={story}
                    onChange={e => setStory(e.target.value)}
                    placeholder="Share your story... How did you get started? What do you love about what you do?"
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">{story.length} characters</p>
                </div>
              )}

              {/* SCREEN 7: Profile Extras */}
              {currentStep?.key === "profile" && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Profile Extras</h2>
                  {user && (
                    <div className="space-y-2">
                      <Label>Profile Image (optional)</Label>
                      <LogoUpload
                        currentUrl={logoUrl || undefined}
                        userId={user.uid}
                        onUploaded={url => setLogoUrl(url)}
                        onRemoved={() => setLogoUrl("")}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Short Descriptor (optional)</Label>
                    <Input
                      value={shortDescriptor}
                      onChange={e => setShortDescriptor(e.target.value.slice(0, 30))}
                      placeholder='e.g. "Gel nails", "IGCSE tuition", "Home bakes"'
                      maxLength={30}
                    />
                    <p className="text-xs text-muted-foreground">{shortDescriptor.length}/30 characters</p>
                  </div>
                </div>
              )}

              {/* SCREEN 8: Compliance */}
              {currentStep?.key === "compliance" && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Compliance</h2>
                  <p className="text-sm text-muted-foreground">Please confirm the following before submitting your listing.</p>
                  <div className="space-y-3">
                    {getComplianceGates(category, serviceLocations).map(gate => (
                      <label
                        key={gate.id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                      >
                        <Checkbox
                          checked={complianceChecks[gate.id] || false}
                          onCheckedChange={(checked) =>
                            setComplianceChecks(prev => ({ ...prev, [gate.id]: !!checked }))
                          }
                          className="mt-0.5"
                        />
                        <span className="text-sm text-foreground">{gate.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* SCREEN 9: Contact */}
              {currentStep?.key === "contact" && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Contact Links</h2>

                  <div className="space-y-2">
                    <Label>Primary contact method *</Label>
                    <SingleChipSelect options={CONTACT_METHODS} selected={primaryContact} onChange={setPrimaryContact} />
                  </div>

                  {primaryContact === "whatsapp" && (
                    <div className="space-y-3 p-4 rounded-xl border border-border bg-secondary/20">
                      <div className="space-y-2">
                        <Label>WhatsApp Number *</Label>
                        <Input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+65 9123 4567" />
                      </div>
                      <div className="space-y-2">
                        <Label>Pre-filled message (optional)</Label>
                        <Input value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)} placeholder="Hi! I'd like to enquire about..." />
                      </div>
                    </div>
                  )}

                  {primaryContact === "instagram" && (
                    <div className="space-y-2 p-4 rounded-xl border border-border bg-secondary/20">
                      <Label>Instagram Handle *</Label>
                      <Input value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} placeholder="@yourbusiness" />
                    </div>
                  )}

                  {primaryContact === "website" && (
                    <div className="space-y-2 p-4 rounded-xl border border-border bg-secondary/20">
                      <Label>Website URL *</Label>
                      <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourbusiness.com" />
                    </div>
                  )}

                  <div className="pt-3 border-t border-border">
                    <div className="space-y-2">
                      <Label>Secondary contact (optional)</Label>
                      <p className="text-xs text-muted-foreground mb-2">Used for the "Book / Order" button. Falls back to primary if not set.</p>
                      <Select value={secondaryContact} onValueChange={setSecondaryContact}>
                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {CONTACT_METHODS.filter(m => m.value !== primaryContact).map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {secondaryContact && secondaryContact !== "none" && (
                      <div className="space-y-2 mt-3">
                        <Label>
                          {secondaryContact === "whatsapp" ? "WhatsApp Number" :
                           secondaryContact === "instagram" ? "Instagram Handle" : "Website URL"}
                        </Label>
                        <Input
                          value={secondaryValue}
                          onChange={e => setSecondaryValue(e.target.value)}
                          placeholder={
                            secondaryContact === "whatsapp" ? "+65 9123 4567" :
                            secondaryContact === "instagram" ? "@yourbusiness" : "https://..."
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button variant="outline" onClick={() => setStepIndex(i => i - 1)} disabled={stepIndex === 0}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>
                {!isLastStep ? (
                  <Button onClick={() => setStepIndex(i => i + 1)} disabled={!canProceed()}>
                    Next <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading || !canProceed()}>
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
