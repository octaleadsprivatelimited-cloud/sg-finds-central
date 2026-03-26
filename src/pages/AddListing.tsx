import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, GeoPoint, query, where, getDocs } from "firebase/firestore";
import { geocodeSingaporePostalCode } from "@/lib/geocode-pincode";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { processImageFiles } from "@/lib/image-utils";

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
  HOME_FOOD_SUBS, BAKING_SUBS, PHOTOGRAPHY_SUBS, TAILORING_SUBS,
  EVENT_SERVICES_SUBS, CLEANING_SUBS,
  SERVICE_LOCATIONS, CONTACT_METHODS,
  type MultiSelectOption,
} from "@/lib/listing-form-config";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Building2, X,
  MapPin, FileText, Phone, Image, ShieldCheck, MessageCircle,
  AlertTriangle, Clock, Upload, Trash2, CloudOff, CheckCircle2,
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
    { key: "description", label: "Description", icon: <FileText className="w-4 h-4" /> },
    { key: "hours", label: "Working Hours", icon: <Clock className="w-4 h-4" /> },
    { key: "images", label: "Images", icon: <Image className="w-4 h-4" /> },
    { key: "profile", label: "Profile Extras", icon: <Image className="w-4 h-4" /> },
  );
  if (needsComplianceScreen(category, serviceLocations)) {
    steps.push({ key: "compliance", label: "Compliance", icon: <ShieldCheck className="w-4 h-4" /> });
  }
  steps.push({ key: "contact", label: "Contact", icon: <MessageCircle className="w-4 h-4" /> });
  return steps;
};

/* ── Days of the week ── */
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasExistingListing, setHasExistingListing] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  
  // ── Screen 1: Category ──
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");

  // ── Screen 2: Business Details ──
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
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
  const [homeFoodSubs, setHomeFoodSubs] = useState<string[]>([]);
  const [homeFoodOther, setHomeFoodOther] = useState("");
  const [bakingSubs, setBakingSubs] = useState<string[]>([]);
  const [bakingOther, setBakingOther] = useState("");
  const [photoSubs, setPhotoSubs] = useState<string[]>([]);
  const [photoOther, setPhotoOther] = useState("");
  const [tailoringSubs, setTailoringSubs] = useState<string[]>([]);
  const [tailoringOther, setTailoringOther] = useState("");
  const [eventSubs, setEventSubs] = useState<string[]>([]);
  const [eventOther, setEventOther] = useState("");
  const [cleaningSubs, setCleaningSubs] = useState<string[]>([]);
  const [cleaningOther, setCleaningOther] = useState("");

  // ── Screen 4: Service location ──
  const [serviceLocations, setServiceLocations] = useState<string[]>([]);
  const [travelArea, setTravelArea] = useState("");

  // ── Screen 5: Address ──
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [geocodingPostal, setGeocodingPostal] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [unitNumber, setUnitNumber] = useState("");

  // ── Screen 6: Description ──
  const [shortDescription, setShortDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");

  // ── Screen 7: Working Hours ──
  const [workingHours, setWorkingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(DAYS.map(d => [d, { open: "09:00", close: "18:00", closed: false }]))
  );

  // ── Screen 8: Images ──
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Screen 9: Profile extras ──
  const [logoUrl, setLogoUrl] = useState("");
  const [shortDescriptor, setShortDescriptor] = useState("");

  // ── Compliance ──
  const [complianceChecks, setComplianceChecks] = useState<Record<string, boolean>>({});

  // ── Contact ──
  const [primaryContact, setPrimaryContact] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("+65");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [secondaryContact, setSecondaryContact] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [verificationDocUrl, setVerificationDocUrl] = useState("");

  // ═══ AUTO-SAVE DRAFT (60 days) ═══
  const DRAFT_KEY = "listing_draft";
  const DRAFT_EXPIRY_DAYS = 60;

  const draftState = useMemo(() => ({
    stepIndex, category, district, name, ownerName, uen,
    subjects, subjectsOther, languages, languagesOther, levels, levelsOther,
    syllabi, syllabiOther, musicArtSub, musicArtOther, beautySubs, beautyOther,
    petSubs, petOther, handymanSubs, handymanOther, homeFoodSubs, homeFoodOther,
    bakingSubs, bakingOther, photoSubs, photoOther, tailoringSubs, tailoringOther,
    eventSubs, eventOther, cleaningSubs, cleaningOther,
    serviceLocations, travelArea, address, postalCode, unitNumber,
    locationLat, locationLng, shortDescription, detailedDescription,
    workingHours, imageUrls, logoUrl, shortDescriptor,
    complianceChecks, primaryContact, whatsappNumber, whatsappMessage,
    instagramHandle, websiteUrl, contactEmail, secondaryContact, secondaryValue,
    verificationDocUrl,
  }), [
    stepIndex, category, district, name, ownerName, uen,
    subjects, subjectsOther, languages, languagesOther, levels, levelsOther,
    syllabi, syllabiOther, musicArtSub, musicArtOther, beautySubs, beautyOther,
    petSubs, petOther, handymanSubs, handymanOther, homeFoodSubs, homeFoodOther,
    bakingSubs, bakingOther, photoSubs, photoOther, tailoringSubs, tailoringOther,
    eventSubs, eventOther, cleaningSubs, cleaningOther,
    serviceLocations, travelArea, address, postalCode, unitNumber,
    locationLat, locationLng, shortDescription, detailedDescription,
    workingHours, imageUrls, logoUrl, shortDescriptor,
    complianceChecks, primaryContact, whatsappNumber, whatsappMessage,
    instagramHandle, websiteUrl, contactEmail, secondaryContact, secondaryValue,
    verificationDocUrl,
  ]);

  // Save draft (debounced) with indicator
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [draftSavedShow, setDraftSavedShow] = useState(false);
  const draftFadeRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!category && !name) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const payload = {
          data: draftState,
          expiresAt: Date.now() + DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        setDraftSavedShow(true);
        clearTimeout(draftFadeRef.current);
        draftFadeRef.current = setTimeout(() => setDraftSavedShow(false), 2500);
      } catch {}
    }, 1000);
    return () => clearTimeout(saveTimerRef.current);
  }, [draftState]);

  // Restore draft on mount
  const [draftRestored, setDraftRestored] = useState(false);
  useEffect(() => {
    if (draftRestored) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) { setDraftRestored(true); return; }
      const { data, expiresAt } = JSON.parse(raw);
      if (Date.now() > expiresAt) {
        localStorage.removeItem(DRAFT_KEY);
        setDraftRestored(true);
        return;
      }
      // Restore all fields
      if (data.stepIndex != null) setStepIndex(data.stepIndex);
      if (data.category) setCategory(data.category);
      if (data.district) setDistrict(data.district);
      if (data.name) setName(data.name);
      if (data.ownerName) setOwnerName(data.ownerName);
      if (data.uen) setUen(data.uen);
      if (data.subjects) setSubjects(data.subjects);
      if (data.subjectsOther) setSubjectsOther(data.subjectsOther);
      if (data.languages) setLanguages(data.languages);
      if (data.languagesOther) setLanguagesOther(data.languagesOther);
      if (data.levels) setLevels(data.levels);
      if (data.levelsOther) setLevelsOther(data.levelsOther);
      if (data.syllabi) setSyllabi(data.syllabi);
      if (data.syllabiOther) setSyllabiOther(data.syllabiOther);
      if (data.musicArtSub) setMusicArtSub(data.musicArtSub);
      if (data.musicArtOther) setMusicArtOther(data.musicArtOther);
      if (data.beautySubs) setBeautySubs(data.beautySubs);
      if (data.beautyOther) setBeautyOther(data.beautyOther);
      if (data.petSubs) setPetSubs(data.petSubs);
      if (data.petOther) setPetOther(data.petOther);
      if (data.handymanSubs) setHandymanSubs(data.handymanSubs);
      if (data.handymanOther) setHandymanOther(data.handymanOther);
      if (data.homeFoodSubs) setHomeFoodSubs(data.homeFoodSubs);
      if (data.homeFoodOther) setHomeFoodOther(data.homeFoodOther);
      if (data.bakingSubs) setBakingSubs(data.bakingSubs);
      if (data.bakingOther) setBakingOther(data.bakingOther);
      if (data.photoSubs) setPhotoSubs(data.photoSubs);
      if (data.photoOther) setPhotoOther(data.photoOther);
      if (data.tailoringSubs) setTailoringSubs(data.tailoringSubs);
      if (data.tailoringOther) setTailoringOther(data.tailoringOther);
      if (data.eventSubs) setEventSubs(data.eventSubs);
      if (data.eventOther) setEventOther(data.eventOther);
      if (data.cleaningSubs) setCleaningSubs(data.cleaningSubs);
      if (data.cleaningOther) setCleaningOther(data.cleaningOther);
      if (data.serviceLocations) setServiceLocations(data.serviceLocations);
      if (data.travelArea) setTravelArea(data.travelArea);
      if (data.address) setAddress(data.address);
      if (data.postalCode) setPostalCode(data.postalCode);
      if (data.unitNumber) setUnitNumber(data.unitNumber);
      if (data.locationLat != null) setLocationLat(data.locationLat);
      if (data.locationLng != null) setLocationLng(data.locationLng);
      if (data.shortDescription) setShortDescription(data.shortDescription);
      if (data.detailedDescription) setDetailedDescription(data.detailedDescription);
      if (data.workingHours) setWorkingHours(data.workingHours);
      if (data.imageUrls?.length) setImageUrls(data.imageUrls);
      if (data.logoUrl) setLogoUrl(data.logoUrl);
      if (data.shortDescriptor) setShortDescriptor(data.shortDescriptor);
      if (data.complianceChecks) setComplianceChecks(data.complianceChecks);
      if (data.primaryContact) setPrimaryContact(data.primaryContact);
      if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
      if (data.whatsappMessage) setWhatsappMessage(data.whatsappMessage);
      if (data.instagramHandle) setInstagramHandle(data.instagramHandle);
      if (data.websiteUrl) setWebsiteUrl(data.websiteUrl);
      if (data.contactEmail) setContactEmail(data.contactEmail);
      if (data.secondaryContact) setSecondaryContact(data.secondaryContact);
      if (data.secondaryValue) setSecondaryValue(data.secondaryValue);
      if (data.verificationDocUrl) setVerificationDocUrl(data.verificationDocUrl);
      toast.info("Draft restored — continue where you left off!", { duration: 4000 });
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    setDraftRestored(true);
  }, [draftRestored]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

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

  useEffect(() => {
    if (stepIndex >= steps.length) setStepIndex(steps.length - 1);
  }, [steps.length, stepIndex]);

  // Auto-geocode postal code
  const handlePostalCodeChange = useCallback(async (code: string) => {
    setPostalCode(code);
    if (code.length === 6) {
      setGeocodingPostal(true);
      const result = await geocodeSingaporePostalCode(code);
      if (result) {
        setLocationLat(result.lat);
        setLocationLng(result.lng);
        if (!address) setAddress(result.address);
        toast.success(`Location found: ${result.address}`);
      } else {
        setLocationLat(null);
        setLocationLng(null);
        toast.error("Could not find location for this postal code");
      }
      setGeocodingPostal(false);
    } else {
      setLocationLat(null);
      setLocationLng(null);
    }
  }, [address]);

  // Detect device location via GPS
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported by your browser"); return; }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationLat(lat);
        setLocationLng(lng);
        // Reverse geocode using OneMap
        try {
          const res = await fetch(`https://www.onemap.gov.sg/api/public/revgeocode?location=${lat},${lng}&buffer=200&addressType=All`);
          const data = await res.json();
          if (data.GeocodeInfo && data.GeocodeInfo.length > 0) {
            const info = data.GeocodeInfo[0];
            const addr = info.BUILDINGNAME !== "NIL" ? `${info.BUILDINGNAME}, ${info.ROAD}` : info.ROAD;
            if (!address) setAddress(addr || "");
            if (!postalCode && info.POSTALCODE && info.POSTALCODE !== "NIL") setPostalCode(info.POSTALCODE);
          }
        } catch {}
        toast.success("Location detected successfully");
        setDetectingLocation(false);
      },
      () => {
        toast.error("Unable to detect location — please enable location access");
        setDetectingLocation(false);
      }
    );
  }, [address, postalCode]);

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  /* ── Inline error helper ── */
  const FieldError = ({ show, message }: { show: boolean; message: string }) =>
    show ? <p className="text-xs font-medium text-destructive mt-1">{message}</p> : null;

  const canProceed = (): boolean => {
    if (!currentStep) return false;
    switch (currentStep.key) {
      case "category": return !!category && !!district;
      case "details": return !!name && !!ownerName && !!uen;
      case "subcategory":
        if (category === "Tuition") return subjects.length > 0 && levels.length > 0 && syllabi.length > 0;
        if (category === "Music / Art / Craft") return !!musicArtSub || !!musicArtOther;
        if (category === "Beauty") return beautySubs.length > 0 || !!beautyOther;
        if (category === "Pet Services") return petSubs.length > 0 || !!petOther;
        if (category === "Handyman") return handymanSubs.length > 0 || !!handymanOther;
        if (category === "Home Food") return homeFoodSubs.length > 0 || !!homeFoodOther;
        if (category === "Baking") return bakingSubs.length > 0 || !!bakingOther;
        if (category === "Photography / Videography") return photoSubs.length > 0 || !!photoOther;
        if (category === "Tailoring") return tailoringSubs.length > 0 || !!tailoringOther;
        if (category === "Event Services") return eventSubs.length > 0 || !!eventOther;
        if (category === "Cleaning") return cleaningSubs.length > 0 || !!cleaningOther;
        return false;
      case "service-location": return serviceLocations.length > 0;
      case "address": return !!address && !!postalCode && locationLat !== null && locationLng !== null;
      case "description": {
        const wc = wordCount(shortDescription);
        return wc >= 50 && wc <= 100 && !!detailedDescription.trim();
      }
      case "hours": return true;
      case "images": return imageUrls.length >= 3;
      case "profile": return true;
      case "compliance": {
        const gates = getComplianceGates(category, serviceLocations);
        return gates.every(g => complianceChecks[g.id] === true);
      }
      case "contact":
        if (!primaryContact) return false;
        if (!contactEmail || !/\S+@\S+\.\S+/.test(contactEmail)) return false;
        if (primaryContact === "whatsapp" && (!whatsappNumber || whatsappNumber === "+65")) return false;
        if (primaryContact === "instagram" && !instagramHandle) return false;
        if (primaryContact === "website" && !websiteUrl) return false;
        if (!agreeTerms) return false;
        return true;
      default: return true;
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!user) return;
    const remaining = 5 - imageUrls.length;
    if (remaining <= 0) { toast.error("Maximum 5 images allowed"); return; }

    setUploadingImages(true);
    try {
      const { validFiles, errors } = await processImageFiles(Array.from(files), remaining);
      errors.forEach(e => toast.error(e));

      if (validFiles.length > 0) {
        const uploadPromises = validFiles.map(async (file) => {
          const ext = file.name.split(".").pop() || "jpg";
          const storageRef = ref(storage, `listings/${user.uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });
        const urls = await Promise.all(uploadPromises);
        setImageUrls(prev => [...prev, ...urls]);
        toast.success(`${urls.length} image(s) uploaded`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload images");
    }
    setUploadingImages(false);
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
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
    if (category === "Home Food") return { subcategories: [...homeFoodSubs, ...(homeFoodOther ? [homeFoodOther] : [])] };
    if (category === "Baking") return { subcategories: [...bakingSubs, ...(bakingOther ? [bakingOther] : [])] };
    if (category === "Photography / Videography") return { subcategories: [...photoSubs, ...(photoOther ? [photoOther] : [])] };
    if (category === "Tailoring") return { subcategories: [...tailoringSubs, ...(tailoringOther ? [tailoringOther] : [])] };
    if (category === "Event Services") return { subcategories: [...eventSubs, ...(eventOther ? [eventOther] : [])] };
    if (category === "Cleaning") return { subcategories: [...cleaningSubs, ...(cleaningOther ? [cleaningOther] : [])] };
    return {};
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (hasExistingListing) { toast.error("One business per account"); return; }

    setLoading(true);
    try {
      await addDoc(collection(db, "listings"), {
        name, ownerName, uen, category, district, address, postalCode, unitNumber,
        shortDescription,
        description: detailedDescription,
        logoUrl, shortDescriptor,
        imageUrls,
        workingHours,
        serviceLocations,
        travelArea: serviceLocations.includes("at-customer-home") ? travelArea : "",
        subcategoryData: buildSubcategoryData(),
        complianceChecks,
        primaryContact,
        contactEmail,
        contactDetails: {
          whatsapp: primaryContact === "whatsapp" ? whatsappNumber : "",
          whatsappMessage: primaryContact === "whatsapp" ? whatsappMessage : "",
          instagram: primaryContact === "instagram" ? instagramHandle : "",
          website: primaryContact === "website" ? websiteUrl : "",
          secondary: secondaryContact ? { method: secondaryContact, value: secondaryValue } : null,
        },
        documentsUrl: verificationDocUrl ? [verificationDocUrl] : [],
        status: "pending_approval",
        ownerId: user.uid,
        location: new GeoPoint(locationLat || 1.3521, locationLng || 103.8198),
        lat: locationLat,
        lng: locationLng,
        createdAt: serverTimestamp(),
      });
      clearDraft();
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
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Directory
          </Button>
          {(category || name) && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => { clearDraft(); window.location.reload(); }}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear Draft
            </Button>
          )}
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Add Your Business</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Please provide your business details clearly and accurately. Your listing will be reviewed by our admin team before it is published.
          </p>
          {draftSavedShow && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Draft saved
            </div>
          )}
        </div>

        {/* Guidelines Banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground text-sm">Important Guidelines</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Do not upload fake or copied content</li>
                <li>Images must belong to your business</li>
                <li>No blurry or unrelated images</li>
                <li>Any changes after submission will require admin approval again</li>
              </ul>
            </div>
          </div>
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
                    <Label>Business Category *</Label>
                    <p className="text-xs text-muted-foreground">e.g., Home Food, Beauty, Tuition, Services, etc.</p>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {BUSINESS_CATEGORIES.filter(c => c !== "All Categories").map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError show={showErrors && !category} message="Please select a category" />
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
                    <FieldError show={showErrors && !district} message="Please select a district" />
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
                    <FieldError show={showErrors && !name} message="Business name is required" />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Name *</Label>
                    <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. Mary Tan" />
                    <FieldError show={showErrors && !ownerName} message="Owner name is required" />
                  </div>
                  <div className="space-y-2">
                    <Label>UEN *</Label>
                    <Input value={uen} onChange={e => setUen(e.target.value)} placeholder="e.g. 201912345A" />
                    <FieldError show={showErrors && !uen} message="UEN is required" />
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
                        <FieldError show={showErrors && subjects.length === 0} message="Please select at least one subject" />
                      </div>
                      <div className="space-y-2">
                        <Label>Languages</Label>
                        <ChipSelect options={TUITION_LANGUAGES} selected={languages} onChange={setLanguages} allowOther otherValue={languagesOther} onOtherChange={setLanguagesOther} />
                      </div>
                      <div className="space-y-2">
                        <Label>Levels supported *</Label>
                        <ChipSelect options={TUITION_LEVELS} selected={levels} onChange={setLevels} allowOther otherValue={levelsOther} onOtherChange={setLevelsOther} />
                        <FieldError show={showErrors && levels.length === 0} message="Please select at least one level" />
                      </div>
                      <div className="space-y-2">
                        <Label>Syllabus supported *</Label>
                        <ChipSelect options={TUITION_SYLLABI} selected={syllabi} onChange={setSyllabi} allowOther otherValue={syllabiOther} onOtherChange={setSyllabiOther} />
                        <FieldError show={showErrors && syllabi.length === 0} message="Please select at least one syllabus" />
                      </div>
                    </>
                  )}

                  {category === "Music / Art / Craft" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Subcategory</h2>
                      <div className="space-y-2">
                        <Label>Select one *</Label>
                        <SingleChipSelect options={MUSIC_ART_CRAFT_SUBS} selected={musicArtSub} onChange={setMusicArtSub} allowOther otherValue={musicArtOther} onOtherChange={setMusicArtOther} />
                        <FieldError show={showErrors && !musicArtSub && !musicArtOther} message="Please select or enter a subcategory" />
                      </div>
                    </>
                  )}

                  {category === "Beauty" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Beauty Services</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={BEAUTY_SUBS} selected={beautySubs} onChange={setBeautySubs} allowOther otherValue={beautyOther} onOtherChange={setBeautyOther} />
                        <FieldError show={showErrors && beautySubs.length === 0 && !beautyOther} message="Please select at least one service" />
                      </div>
                    </>
                  )}

                  {category === "Pet Services" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Pet Services</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={PET_SUBS} selected={petSubs} onChange={setPetSubs} allowOther otherValue={petOther} onOtherChange={setPetOther} />
                        <FieldError show={showErrors && petSubs.length === 0 && !petOther} message="Please select at least one service" />
                      </div>
                    </>
                  )}

                  {category === "Handyman" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Handyman Services</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={HANDYMAN_SUBS} selected={handymanSubs} onChange={setHandymanSubs} allowOther otherValue={handymanOther} onOtherChange={setHandymanOther} />
                        <FieldError show={showErrors && handymanSubs.length === 0 && !handymanOther} message="Please select at least one service" />
                      </div>
                    </>
                  )}

                  {category === "Home Food" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Home Food Type</h2>
                      <div className="space-y-2">
                        <Label>Select cuisine type *</Label>
                        <ChipSelect options={HOME_FOOD_SUBS} selected={homeFoodSubs} onChange={setHomeFoodSubs} allowOther otherValue={homeFoodOther} onOtherChange={setHomeFoodOther} />
                        <FieldError show={showErrors && homeFoodSubs.length === 0 && !homeFoodOther} message="Please select at least one cuisine type" />
                      </div>
                    </>
                  )}

                  {category === "Baking" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Baking Speciality</h2>
                      <div className="space-y-2">
                        <Label>Select baked goods *</Label>
                        <ChipSelect options={BAKING_SUBS} selected={bakingSubs} onChange={setBakingSubs} allowOther otherValue={bakingOther} onOtherChange={setBakingOther} />
                        <FieldError show={showErrors && bakingSubs.length === 0 && !bakingOther} message="Please select at least one type" />
                      </div>
                    </>
                  )}

                  {category === "Photography / Videography" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Photography / Videography</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={PHOTOGRAPHY_SUBS} selected={photoSubs} onChange={setPhotoSubs} allowOther otherValue={photoOther} onOtherChange={setPhotoOther} />
                        <FieldError show={showErrors && photoSubs.length === 0 && !photoOther} message="Please select at least one service" />
                      </div>
                    </>
                  )}

                  {category === "Tailoring" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Tailoring Services</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={TAILORING_SUBS} selected={tailoringSubs} onChange={setTailoringSubs} allowOther otherValue={tailoringOther} onOtherChange={setTailoringOther} />
                        <FieldError show={showErrors && tailoringSubs.length === 0 && !tailoringOther} message="Please select at least one service" />
                      </div>
                    </>
                  )}

                  {category === "Event Services" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Event Services</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={EVENT_SERVICES_SUBS} selected={eventSubs} onChange={setEventSubs} allowOther otherValue={eventOther} onOtherChange={setEventOther} />
                        <FieldError show={showErrors && eventSubs.length === 0 && !eventOther} message="Please select at least one service" />
                      </div>
                    </>
                  )}

                  {category === "Cleaning" && (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">Cleaning Services</h2>
                      <div className="space-y-2">
                        <Label>Select services *</Label>
                        <ChipSelect options={CLEANING_SUBS} selected={cleaningSubs} onChange={setCleaningSubs} allowOther otherValue={cleaningOther} onOtherChange={setCleaningOther} />
                        <FieldError show={showErrors && cleaningSubs.length === 0 && !cleaningOther} message="Please select at least one service" />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SCREEN 4: Service Location */}
              {currentStep?.key === "service-location" && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Where does your service happen?</h2>
                  <p className="text-sm text-muted-foreground">Do you provide home service / delivery?</p>
                  <ChipSelect options={SERVICE_LOCATIONS} selected={serviceLocations} onChange={setServiceLocations} />
                  <FieldError show={showErrors && serviceLocations.length === 0} message="Please select at least one service location" />
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
                  <p className="text-sm text-muted-foreground">We'll pin your business on the map for customers to find you easily.</p>
                  
                  {/* Detect Location Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                  >
                    {detectingLocation ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-2" />
                    )}
                    {detectingLocation ? "Detecting location..." : "Detect My Location"}
                  </Button>

                  <div className="space-y-2">
                    <Label>Address *</Label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 391 Orchard Road, #B2-01" />
                    <FieldError show={showErrors && !address} message="Address is required" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Postal Code *</Label>
                      <Input
                        value={postalCode}
                        onChange={e => handlePostalCodeChange(e.target.value)}
                        placeholder="e.g. 238872"
                        maxLength={6}
                      />
                      {geocodingPostal && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Looking up location...</p>}
                      <FieldError show={showErrors && !postalCode} message="Postal code is required" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Number (private)</Label>
                      <Input value={unitNumber} onChange={e => setUnitNumber(e.target.value)} placeholder="e.g. #12-345" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Unit number is kept private and won't be shown publicly.</p>

                  {/* Location status */}
                  {locationLat !== null && locationLng !== null ? (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Location pinned</p>
                        <p className="text-xs text-muted-foreground">Lat: {locationLat.toFixed(4)}, Lng: {locationLng.toFixed(4)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-xs text-muted-foreground">Enter a valid 6-digit postal code or use "Detect My Location" to pin your business on the map.</p>
                    </div>
                  )}
                  <FieldError show={showErrors && (locationLat === null || locationLng === null)} message="Location is required — enter postal code or detect your location" />

                  {/* Map preview */}
                  {locationLat !== null && locationLng !== null && (
                    <div className="rounded-lg overflow-hidden border border-border h-[200px]">
                      <iframe
                        title="Business Location"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.google.com/maps?q=${locationLat},${locationLng}&z=16&output=embed`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SCREEN 6: Description */}
              {currentStep?.key === "description" && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Business Description</h2>

                  <div className="space-y-2">
                    <Label>Short Description (50–100 words) *</Label>
                    <p className="text-xs text-muted-foreground">Explain what you offer and what makes your business unique.</p>
                    <Textarea
                      value={shortDescription}
                      onChange={e => setShortDescription(e.target.value)}
                      placeholder="e.g. We specialize in premium home-baked artisan cookies and cakes, made with high-quality ingredients. What sets us apart is our personalized approach — every order is customized to your taste preferences..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className={`text-xs text-right ${wordCount(shortDescription) < 50 ? "text-destructive" : wordCount(shortDescription) > 100 ? "text-destructive" : "text-muted-foreground"}`}>
                      {wordCount(shortDescription)} / 50–100 words
                    </p>
                    <FieldError show={showErrors && wordCount(shortDescription) < 50} message={`Need at least 50 words (currently ${wordCount(shortDescription)})`} />
                    <FieldError show={showErrors && wordCount(shortDescription) > 100} message={`Maximum 100 words allowed (currently ${wordCount(shortDescription)})`} />
                  </div>

                  <div className="space-y-2">
                    <Label>Detailed Description *</Label>
                    <p className="text-xs text-muted-foreground">Services or products you provide, pricing (optional), experience or background.</p>
                    <Textarea
                      value={detailedDescription}
                      onChange={e => setDetailedDescription(e.target.value)}
                      placeholder="Share details about your services, products, pricing, and experience..."
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">{detailedDescription.length} characters</p>
                    <FieldError show={showErrors && !detailedDescription.trim()} message="Detailed description is required" />
                  </div>
                </div>
              )}

              {/* SCREEN 7: Working Hours */}
              {currentStep?.key === "hours" && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Working Hours</h2>
                  <p className="text-sm text-muted-foreground">Set your available days and timings.</p>
                  <div className="space-y-2">
                    {DAYS.map(day => {
                      const h = workingHours[day];
                      return (
                        <div key={day} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-secondary/20">
                          <Checkbox
                            checked={!h.closed}
                            onCheckedChange={(checked) =>
                              setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !checked } }))
                            }
                          />
                          <span className="text-sm font-medium w-20 shrink-0">{day.slice(0, 3)}</span>
                          {h.closed ? (
                            <span className="text-xs text-muted-foreground">Closed</span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-1">
                              <Input
                                type="time"
                                value={h.open}
                                onChange={e => setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                                className="h-8 text-xs w-auto"
                              />
                              <span className="text-xs text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={h.close}
                                onChange={e => setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                                className="h-8 text-xs w-auto"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 8: Images Upload */}
              {currentStep?.key === "images" && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Business Images</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload 3–5 high-quality images of your business, products, or services. No blurry or unrelated images.
                  </p>

                  {/* Image grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img src={url} alt={`Business ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {imageUrls.length < 5 && (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImages}
                        className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors"
                      >
                        {uploadingImages ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            <span className="text-[10px]">Upload</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleImageUpload(e.target.files);
                        e.target.value = "";
                      }
                    }}
                  />

                  <p className="text-xs text-muted-foreground">
                    {imageUrls.length}/5 images uploaded. Minimum 3 required. Max 5MB each. JPG, PNG, or WEBP.
                  </p>
                  <FieldError show={showErrors && imageUrls.length < 3} message={`Please upload at least 3 images (${imageUrls.length} uploaded)`} />
                </div>
              )}

              {/* SCREEN 9: Profile Extras */}
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

              {/* Compliance */}
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

              {/* Contact */}
              {currentStep?.key === "contact" && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Contact Details</h2>

                  <div className="space-y-2">
                    <Label>Email Address (Mandatory) *</Label>
                    <Input
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="info@yourbusiness.com"
                    />
                    <FieldError show={showErrors && (!contactEmail || !/\S+@\S+\.\S+/.test(contactEmail))} message="Valid email address is required" />
                  </div>

                  <div className="space-y-2">
                    <Label>Primary contact method *</Label>
                    <p className="text-xs text-muted-foreground">Phone Number (WhatsApp preferred)</p>
                    <SingleChipSelect options={CONTACT_METHODS} selected={primaryContact} onChange={setPrimaryContact} />
                    <FieldError show={showErrors && !primaryContact} message="Please select a contact method" />
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
                      <Label>Social Media / Website (optional)</Label>
                      <p className="text-xs text-muted-foreground mb-2">Instagram / Facebook / Website link. Used for the "Book / Order" button.</p>
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

                  {/* Verification Document URL */}
                  <div className="pt-3 border-t border-border space-y-2">
                    <Label>Verification Document URL (optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Share a Google Drive, Dropbox, or OneDrive link to your ACRA business profile, license, or property ownership documents for faster verification. 
                      <strong className="text-foreground"> Make sure the link is set to "Anyone with the link can view".</strong>
                    </p>
                    <Input
                      value={verificationDocUrl}
                      onChange={e => setVerificationDocUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/... or https://www.dropbox.com/..."
                    />
                    {verificationDocUrl && !/^https?:\/\/.+/.test(verificationDocUrl) && (
                      <p className="text-xs text-destructive">Please enter a valid URL starting with https://</p>
                    )}
                  </div>

                  {/* Agreement */}
                  <div className="pt-4 border-t border-border">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={agreeTerms}
                        onCheckedChange={(checked) => setAgreeTerms(!!checked)}
                        className="mt-0.5"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        By submitting, I agree that my listing will be reviewed before going live and any updates will go through the approval process. I confirm all content and images belong to my business.
                      </span>
                    </label>
                    <FieldError show={showErrors && !agreeTerms} message="You must agree to the terms before submitting" />
                  </div>
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button variant="outline" onClick={() => { setShowErrors(false); setStepIndex(i => i - 1); }} disabled={stepIndex === 0}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>
                {!isLastStep ? (
                  <Button onClick={() => {
                    if (canProceed()) {
                      setShowErrors(false);
                      setStepIndex(i => i + 1);
                    } else {
                      setShowErrors(true);
                      toast.error("Please fill in all required fields");
                    }
                  }}>
                    Next <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button onClick={() => {
                    if (canProceed()) {
                      handleSubmit();
                    } else {
                      setShowErrors(true);
                      toast.error("Please fill in all required fields");
                    }
                  }} disabled={loading}>
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
