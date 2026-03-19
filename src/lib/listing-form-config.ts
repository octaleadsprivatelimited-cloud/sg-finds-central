// ── Subcategory / conditional screen config for AddListing wizard ──

export interface MultiSelectOption {
  label: string;
  value: string;
}

// ── 3A  Tuition ──
export const TUITION_SUBJECTS: MultiSelectOption[] = [
  { label: "Maths", value: "maths" },
  { label: "English", value: "english" },
  { label: "Biology", value: "biology" },
  { label: "Physics", value: "physics" },
  { label: "Chemistry", value: "chemistry" },
  { label: "Economics", value: "economics" },
];

export const TUITION_LANGUAGES: MultiSelectOption[] = [
  { label: "Hindi", value: "hindi" },
  { label: "Chinese", value: "chinese" },
  { label: "Spanish", value: "spanish" },
  { label: "French", value: "french" },
  { label: "Tamil", value: "tamil" },
  { label: "Malay", value: "malay" },
];

export const TUITION_LEVELS: MultiSelectOption[] = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Cambridge IGCSE / GCSE", value: "igcse" },
  { label: "JC / A-Level", value: "jc-alevel" },
  { label: "IB", value: "ib" },
];

export const TUITION_SYLLABI: MultiSelectOption[] = [
  { label: "MOE Singapore", value: "moe" },
  { label: "IB (MYP)", value: "ib-myp" },
  { label: "IB (DP)", value: "ib-dp" },
  { label: "Cambridge IGCSE / GCSE", value: "cambridge" },
  { label: "A-Level / JC", value: "alevel-jc" },
];

// ── 3B  Music / Art / Craft ──
export const MUSIC_ART_CRAFT_SUBS: MultiSelectOption[] = [
  { label: "Music", value: "music" },
  { label: "Art", value: "art" },
  { label: "Craft", value: "craft" },
];

// ── 3C  Beauty ──
export const BEAUTY_SUBS: MultiSelectOption[] = [
  { label: "Nails", value: "nails" },
  { label: "Lashes", value: "lashes" },
  { label: "Brows", value: "brows" },
  { label: "Hair", value: "hair" },
  { label: "Makeup", value: "makeup" },
];

// ── 3D  Pet Services ──
export const PET_SUBS: MultiSelectOption[] = [
  { label: "Dog walking", value: "dog-walking" },
  { label: "Pet sitting", value: "pet-sitting" },
  { label: "Basic grooming", value: "basic-grooming" },
];

// ── 3E  Handyman ──
export const HANDYMAN_SUBS: MultiSelectOption[] = [
  { label: "Carpenter", value: "carpenter" },
  { label: "Plumber", value: "plumber" },
  { label: "Minor electrical repairs", value: "minor-electrical" },
  { label: "Patching / painting", value: "patching-painting" },
];

// ── Helper: get subcategories for a category ──
export function getSubcategoriesForCategory(category: string): MultiSelectOption[] | null {
  switch (category) {
    case "Tuition": return [...TUITION_SUBJECTS, ...TUITION_LANGUAGES];
    case "Music / Art / Craft": return MUSIC_ART_CRAFT_SUBS;
    case "Beauty": return BEAUTY_SUBS;
    case "Pet Services": return PET_SUBS;
    case "Handyman": return HANDYMAN_SUBS;
    default: return null;
  }
}

// ── Service location options (Screen 4) ──
export const SERVICE_LOCATIONS: MultiSelectOption[] = [
  { label: "At my home (customers come to me)", value: "at-my-home" },
  { label: "At customer's home (I travel)", value: "at-customer-home" },
  { label: "Online", value: "online" },
  { label: "Venue-based (studio/shop/public place)", value: "venue-based" },
];

// ── Primary contact methods (Screen 9) ──
export const CONTACT_METHODS: MultiSelectOption[] = [
  { label: "WhatsApp Business", value: "whatsapp" },
  { label: "Instagram", value: "instagram" },
  { label: "Website", value: "website" },
];

// ── Categories that require subcategory screen ──
export const CATEGORIES_WITH_SUBCATEGORY = [
  "Tuition",
  "Music / Art / Craft",
  "Beauty",
  "Pet Services",
  "Handyman",
] as const;

// ── Categories that skip subcategory (Screen 3) ──
export const CATEGORIES_SKIP_SUBCATEGORY = [
  "Home Food",
  "Baking",
  "Photography / Videography",
  "Tailoring",
  "Event Services",
  "Cleaning",
] as const;

// ── Compliance gates (Screen 8) ──
export interface ComplianceGate {
  id: string;
  label: string;
  blocking: boolean; // if true, unchecked = block listing
}

export const FOOD_COMPLIANCE: ComplianceGate[] = [
  { id: "no-catering", label: "I do not offer catering.", blocking: true },
  { id: "no-raw-seafood", label: "I will not sell ready-to-eat raw seafood.", blocking: true },
  { id: "sfa-comply", label: "I understand I must comply with SFA requirements for home-based food businesses.", blocking: true },
];

export const CLEANING_COMPLIANCE: ComplianceGate[] = [
  { id: "private-homes-only", label: "I provide cleaning only for private homes.", blocking: true },
];

export const HANDYMAN_COMPLIANCE: ComplianceGate[] = [
  { id: "no-regulated-work", label: "I do not provide electrical wiring/DB work or regulated plumbing.", blocking: true },
];

export const HOME_BASED_COMPLIANCE: ComplianceGate[] = [
  { id: "no-signage", label: "No external signage is displayed at my premises.", blocking: true },
  { id: "no-non-resident", label: "No non-resident employees work from my home.", blocking: true },
  { id: "no-nuisance", label: "My business does not cause nuisance to neighbours.", blocking: true },
];

// ── Helper: does category need subcategory screen? ──
export function needsSubcategoryScreen(category: string): boolean {
  return (CATEGORIES_WITH_SUBCATEGORY as readonly string[]).includes(category);
}

// ── Helper: does category need compliance screen? ──
export function needsComplianceScreen(category: string, serviceLocations: string[]): boolean {
  const foodCats = ["Home Food", "Baking"];
  if (foodCats.includes(category)) return true;
  if (category === "Cleaning") return true;
  if (category === "Handyman") return true;
  if (serviceLocations.includes("at-my-home")) return true;
  return false;
}

// ── Helper: get compliance gates for category ──
export function getComplianceGates(category: string, serviceLocations: string[]): ComplianceGate[] {
  const gates: ComplianceGate[] = [];
  const foodCats = ["Home Food", "Baking"];
  if (foodCats.includes(category)) gates.push(...FOOD_COMPLIANCE);
  if (category === "Cleaning") gates.push(...CLEANING_COMPLIANCE);
  if (category === "Handyman") gates.push(...HANDYMAN_COMPLIANCE);
  if (serviceLocations.includes("at-my-home")) gates.push(...HOME_BASED_COMPLIANCE);
  return gates;
}
