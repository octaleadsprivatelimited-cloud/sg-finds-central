import type { Listing } from "@/components/ListingCard";
import { DEFAULT_OPERATING_HOURS } from "@/components/ListingCard";

// Business cover images
import food1 from "@/assets/businesses/food1.jpg";
import food2 from "@/assets/businesses/food2.jpg";
import retail1 from "@/assets/businesses/retail1.jpg";
import retail2 from "@/assets/businesses/retail2.jpg";
import healthcare1 from "@/assets/businesses/healthcare1.jpg";
import healthcare2 from "@/assets/businesses/healthcare2.jpg";
import education1 from "@/assets/businesses/education1.jpg";
import education2 from "@/assets/businesses/education2.jpg";
import professional1 from "@/assets/businesses/professional1.jpg";
import beauty1 from "@/assets/businesses/beauty1.jpg";
import beauty2 from "@/assets/businesses/beauty2.jpg";
import home1 from "@/assets/businesses/home1.jpg";
import home2 from "@/assets/businesses/home2.jpg";
import auto1 from "@/assets/businesses/auto1.jpg";
import tech1 from "@/assets/businesses/tech1.jpg";
import tech2 from "@/assets/businesses/tech2.jpg";
import realestate1 from "@/assets/businesses/realestate1.jpg";
import legal1 from "@/assets/businesses/legal1.jpg";
import financial1 from "@/assets/businesses/financial1.jpg";
import logistics1 from "@/assets/businesses/logistics1.jpg";
import events1 from "@/assets/businesses/events1.jpg";
import construction1 from "@/assets/businesses/construction1.jpg";

// Gallery images
import food1b from "@/assets/businesses/food1-b.jpg";
import food1c from "@/assets/businesses/food1-c.jpg";
import food2b from "@/assets/businesses/food2-b.jpg";
import food2c from "@/assets/businesses/food2-c.jpg";
import tech1b from "@/assets/businesses/tech1-b.jpg";
import tech1c from "@/assets/businesses/tech1-c.jpg";
import tech2b from "@/assets/businesses/tech2-b.jpg";
import tech2c from "@/assets/businesses/tech2-c.jpg";
import beauty1b from "@/assets/businesses/beauty1-b.jpg";
import beauty1c from "@/assets/businesses/beauty1-c.jpg";
import beauty2b from "@/assets/businesses/beauty2-b.jpg";
import beauty2c from "@/assets/businesses/beauty2-c.jpg";
import education1b from "@/assets/businesses/education1-b.jpg";
import education1c from "@/assets/businesses/education1-c.jpg";
import education2b from "@/assets/businesses/education2-b.jpg";
import education2c from "@/assets/businesses/education2-c.jpg";
import home1b from "@/assets/businesses/home1-b.jpg";
import home1c from "@/assets/businesses/home1-c.jpg";
import home2b from "@/assets/businesses/home2-b.jpg";
import home2c from "@/assets/businesses/home2-c.jpg";
import retail1b from "@/assets/businesses/retail1-b.jpg";
import retail1c from "@/assets/businesses/retail1-c.jpg";
import retail2b from "@/assets/businesses/retail2-b.jpg";
import retail2c from "@/assets/businesses/retail2-c.jpg";
import healthcare1b from "@/assets/businesses/healthcare1-b.jpg";
import healthcare1c from "@/assets/businesses/healthcare1-c.jpg";
import healthcare2b from "@/assets/businesses/healthcare2-b.jpg";
import healthcare2c from "@/assets/businesses/healthcare2-c.jpg";
import professional1b from "@/assets/businesses/professional1-b.jpg";
import professional1c from "@/assets/businesses/professional1-c.jpg";
import auto1b from "@/assets/businesses/auto1-b.jpg";
import auto1c from "@/assets/businesses/auto1-c.jpg";
import realestate1b from "@/assets/businesses/realestate1-b.jpg";
import realestate1c from "@/assets/businesses/realestate1-c.jpg";
import legal1b from "@/assets/businesses/legal1-b.jpg";
import legal1c from "@/assets/businesses/legal1-c.jpg";
import financial1b from "@/assets/businesses/financial1-b.jpg";
import financial1c from "@/assets/businesses/financial1-c.jpg";
import logistics1b from "@/assets/businesses/logistics1-b.jpg";
import logistics1c from "@/assets/businesses/logistics1-c.jpg";
import events1b from "@/assets/businesses/events1-b.jpg";
import events1c from "@/assets/businesses/events1-c.jpg";
import construction1b from "@/assets/businesses/construction1-b.jpg";
import construction1c from "@/assets/businesses/construction1-c.jpg";

export const GALLERY_MAP: Record<string, string[]> = {
  "1": [food1, food1b, food1c],
  "2": [tech1, tech1b, tech1c],
  "3": [beauty1, beauty1b, beauty1c],
  "4": [education1, education1b, education1c],
  "5": [home1, home1b, home1c],
  "1b": [food2, food2b, food2c],
  "6": [retail1, retail1b, retail1c],
  "6b": [retail2, retail2b, retail2c],
  "7": [healthcare1, healthcare1b, healthcare1c],
  "7b": [healthcare2, healthcare2b, healthcare2c],
  "4b": [education2, education2b, education2c],
  "8": [professional1, professional1b, professional1c],
  "3b": [beauty2, beauty2b, beauty2c],
  "5b": [home2, home2b, home2c],
  "9": [auto1, auto1b, auto1c],
  "2b": [tech2, tech2b, tech2c],
  "10": [realestate1, realestate1b, realestate1c],
  "11": [legal1, legal1b, legal1c],
  "12": [financial1, financial1b, financial1c],
  "13": [logistics1, logistics1b, logistics1c],
  "14": [events1, events1b, events1c],
  "15": [construction1, construction1b, construction1c],
};

export const DEMO_LISTINGS: Listing[] = [
  { id: "1", name: "Singapore Delights Pte Ltd", uen: "201912345A", category: "Food & Beverage", district: "Orchard", address: "391 Orchard Road, #B2-01, Singapore 238872", postalCode: "238872", phone: "+65 6234 5678", website: "https://sgdelights.com", email: "info@sgdelights.com", whatsapp: "+6592345678", description: "Award-winning local cuisine serving traditional Peranakan dishes with a modern twist. Our chefs bring decades of experience crafting authentic flavours with contemporary presentation. From signature laksa to handmade kuehs, every dish tells a story of Singapore's rich culinary heritage.", status: "approved", ownerId: "demo", lat: 1.3048, lng: 103.8318, verified: true, featured: true, rating: 4.8, reviewCount: 127, coverImage: food1, operatingHours: { ...DEFAULT_OPERATING_HOURS, Monday: { open: "08:00", close: "22:00" }, Tuesday: { open: "08:00", close: "22:00" }, Wednesday: { open: "08:00", close: "22:00" }, Thursday: { open: "08:00", close: "22:00" }, Friday: { open: "08:00", close: "22:00" }, Saturday: { open: "09:00", close: "22:00" } }, offers: [{ id: "o1", title: "Lunch Special", description: "20% off all set lunches from Mon-Fri", discount: "20% OFF", validUntil: "2026-04-30", code: "LUNCH20" }] },
  { id: "1b", name: "Hawker King", uen: "202011111A", category: "Food & Beverage", district: "Chinatown", address: "335 Smith Street, Singapore 050335", postalCode: "050335", phone: "+65 6111 1111", description: "Authentic hawker-style dishes in a modern setting. Famous for chicken rice and laksa.", status: "approved", ownerId: "demo", lat: 1.2822, lng: 103.8441, rating: 4.6, reviewCount: 203, coverImage: food2, operatingHours: { ...DEFAULT_OPERATING_HOURS, Monday: { open: "07:00", close: "21:00" }, Tuesday: { open: "07:00", close: "21:00" }, Wednesday: { open: "07:00", close: "21:00" }, Thursday: { open: "07:00", close: "21:00" }, Friday: { open: "07:00", close: "21:00" }, Saturday: { open: "07:00", close: "21:00" } }, offers: [{ id: "o5", title: "Weekday Combo", description: "Any 2 mains + drink for $12.90", discount: "$12.90", validUntil: "2026-05-15", code: "COMBO13" }] },
  { id: "6", name: "Orchard Lifestyle Store", uen: "202100001F", category: "Retail & Shopping", district: "Orchard", address: "290 Orchard Road, #05-12, Singapore 238859", postalCode: "238859", phone: "+65 6600 1001", website: "https://orchardlifestyle.sg", email: "hello@orchardlifestyle.sg", description: "Curated lifestyle products from local and international brands.", status: "approved", ownerId: "demo", lat: 1.3040, lng: 103.8325, verified: true, featured: true, rating: 4.5, reviewCount: 78, coverImage: retail1, operatingHours: { ...DEFAULT_OPERATING_HOURS, Saturday: { open: "10:00", close: "21:00" }, Sunday: { open: "11:00", close: "19:00", closed: false } } },
  { id: "6b", name: "ShopLocal SG", uen: "202200099Z", category: "Retail & Shopping", district: "Bugis", address: "200 Victoria Street, #02-48, Singapore 188021", postalCode: "188021", phone: "+65 6600 2002", description: "Supporting local artisans — handmade crafts, fashion, and gifts.", status: "approved", ownerId: "demo", lat: 1.2993, lng: 103.8555, rating: 4.3, reviewCount: 45, coverImage: retail2, operatingHours: DEFAULT_OPERATING_HOURS },
  { id: "7", name: "HealthFirst Medical Clinic", uen: "201800002G", category: "Healthcare & Medical", district: "Novena", address: "6 Napier Road, #08-01, Singapore 258499", postalCode: "258499", phone: "+65 6700 2002", website: "https://healthfirst.sg", email: "info@healthfirst.sg", description: "Comprehensive family medicine and specialist consultations.", status: "approved", ownerId: "demo", lat: 1.3115, lng: 103.8260, verified: true, rating: 4.9, reviewCount: 210, coverImage: healthcare1, operatingHours: { ...DEFAULT_OPERATING_HOURS, Saturday: { open: "09:00", close: "13:00" } } },
  { id: "7b", name: "SmileBright Dental", uen: "202133344H", category: "Healthcare & Medical", district: "Toa Payoh", address: "490 Lorong 6 Toa Payoh, #02-11, Singapore 310490", postalCode: "310490", phone: "+65 6700 3003", description: "Gentle dental care for the whole family, from braces to implants.", status: "approved", ownerId: "demo", lat: 1.3343, lng: 103.8500, rating: 4.7, reviewCount: 92, coverImage: healthcare2, operatingHours: DEFAULT_OPERATING_HOURS },
  { id: "4", name: "LearnSG Academy", uen: "201854321D", category: "Education & Training", district: "Tampines", address: "1 Tampines Walk, #03-12, Singapore 528523", postalCode: "528523", phone: "+65 6456 7890", email: "enrol@learnsg.com", description: "Enrichment centre offering coding, robotics, and STEM courses for ages 5–16. Our curriculum is designed by experienced educators and tech professionals to nurture the next generation of innovators.", status: "approved", ownerId: "demo", lat: 1.3530, lng: 103.9453, rating: 4.6, reviewCount: 42, coverImage: education1, operatingHours: { ...DEFAULT_OPERATING_HOURS, Saturday: { open: "09:00", close: "17:00" }, Sunday: { open: "09:00", close: "14:00", closed: false } } },
  { id: "4b", name: "TutorHub SG", uen: "202244455I", category: "Education & Training", district: "Bishan", address: "9 Bishan Place, #04-01, Singapore 579837", postalCode: "579837", phone: "+65 6456 8901", description: "Expert tutoring in Math, Science, and English for primary to JC levels.", status: "approved", ownerId: "demo", lat: 1.3508, lng: 103.8491, verified: true, rating: 4.8, reviewCount: 135, coverImage: education2, operatingHours: { ...DEFAULT_OPERATING_HOURS, Saturday: { open: "09:00", close: "18:00" } } },
  { id: "8", name: "PrimeConsult Advisory", uen: "201900003H", category: "Professional Services", district: "CBD / Raffles Place", address: "80 Robinson Road, #15-01, Singapore 068898", postalCode: "068898", phone: "+65 6800 3003", website: "https://primeconsult.sg", email: "info@primeconsult.sg", description: "Business advisory, accounting, and corporate secretarial services.", status: "approved", ownerId: "demo", lat: 1.2810, lng: 103.8500, verified: true, rating: 4.7, reviewCount: 63, coverImage: professional1, operatingHours: DEFAULT_OPERATING_HOURS },
  { id: "3", name: "Glow Aesthetics Clinic", uen: "202212345C", category: "Beauty & Wellness", district: "Novena", address: "10 Sinaran Drive, #10-05, Singapore 307506", postalCode: "307506", phone: "+65 6345 6789", email: "appointments@glowaesthetics.sg", description: "Premium aesthetic treatments using FDA-approved technology. Our clinic offers a comprehensive range of non-invasive procedures including laser treatments, dermal fillers, and skin rejuvenation therapies performed by certified medical professionals.", status: "approved", ownerId: "demo", lat: 1.3204, lng: 103.8447, verified: true, rating: 4.7, reviewCount: 64, coverImage: beauty1, operatingHours: { ...DEFAULT_OPERATING_HOURS, Monday: { open: "10:00", close: "20:00" }, Tuesday: { open: "10:00", close: "20:00" }, Wednesday: { open: "10:00", close: "20:00" }, Thursday: { open: "10:00", close: "20:00" }, Friday: { open: "10:00", close: "20:00" }, Saturday: { open: "10:00", close: "18:00" } }, offers: [{ id: "o2", title: "New Client Package", description: "First facial treatment at 50% off", discount: "50% OFF", validUntil: "2026-05-31", code: "GLOW50" }, { id: "o3", title: "Refer a Friend", description: "Get $20 credit when you refer a friend", discount: "$20 Credit", validUntil: "2026-06-30" }] },
  { id: "3b", name: "Zen Spa & Massage", uen: "202355566J", category: "Beauty & Wellness", district: "Kallang", address: "1 Stadium Place, #01-35, Singapore 397628", postalCode: "397628", phone: "+65 6345 7890", description: "Traditional Thai and Swedish massage in a tranquil oasis.", status: "approved", ownerId: "demo", lat: 1.3025, lng: 103.8753, rating: 4.5, reviewCount: 88, coverImage: beauty2, operatingHours: { ...DEFAULT_OPERATING_HOURS, Monday: { open: "10:00", close: "22:00" }, Tuesday: { open: "10:00", close: "22:00" }, Wednesday: { open: "10:00", close: "22:00" }, Thursday: { open: "10:00", close: "22:00" }, Friday: { open: "10:00", close: "22:00" }, Saturday: { open: "10:00", close: "22:00" }, Sunday: { open: "11:00", close: "20:00", closed: false } } },
  { id: "5", name: "HomeFixSG Services", uen: "202098765E", category: "Home Services", district: "Jurong East", address: "21 Jurong East St 31, Singapore 609517", postalCode: "609517", phone: "+65 6567 8901", whatsapp: "+6595678901", description: "Reliable plumbing, electrical, and aircon servicing across Singapore. Our certified technicians respond within 2 hours for emergency jobs. Transparent pricing with no hidden charges.", status: "approved", ownerId: "demo", lat: 1.3329, lng: 103.7436, verified: true, featured: true, rating: 4.5, reviewCount: 156, coverImage: home1, operatingHours: { ...DEFAULT_OPERATING_HOURS, Saturday: { open: "08:00", close: "17:00" } } },
  { id: "5b", name: "CleanPro SG", uen: "202466677K", category: "Home Services", district: "Clementi", address: "321 Clementi Ave 3, #01-05, Singapore 129905", postalCode: "129905", phone: "+65 6567 2222", description: "Professional home and office cleaning services with eco-friendly products.", status: "approved", ownerId: "demo", lat: 1.3150, lng: 103.7650, rating: 4.4, reviewCount: 112, coverImage: home2, operatingHours: DEFAULT_OPERATING_HOURS },
  { id: "9", name: "SpeedWorks Auto", uen: "202000004I", category: "Automotive", district: "Bukit Merah", address: "163 Bukit Merah Central, #01-20, Singapore 150163", postalCode: "150163", phone: "+65 6900 4004", description: "Full car servicing, grooming, and performance tuning.", status: "approved", ownerId: "demo", lat: 1.2870, lng: 103.8160, verified: true, rating: 4.6, reviewCount: 97, coverImage: auto1, operatingHours: { ...DEFAULT_OPERATING_HOURS, Saturday: { open: "08:00", close: "17:00" } } },
  { id: "2", name: "TechHub Solutions", uen: "202301234B", category: "Technology & IT", district: "CBD / Raffles Place", address: "1 Raffles Place, #30-01, Singapore 048616", postalCode: "048616", phone: "+65 6789 0123", website: "https://techhub.sg", email: "hello@techhub.sg", whatsapp: "+6597890123", description: "Full-service IT consultancy specializing in cloud infrastructure and cybersecurity. We help businesses of all sizes transform their digital operations with enterprise-grade solutions, 24/7 support, and proactive security monitoring.", status: "approved", ownerId: "demo", lat: 1.2840, lng: 103.8510, verified: true, featured: true, rating: 4.9, reviewCount: 89, coverImage: tech1, operatingHours: DEFAULT_OPERATING_HOURS, offers: [{ id: "o4", title: "Startup Package", description: "Free 1-hour consultation for new businesses", discount: "FREE", validUntil: "2026-04-15" }] },
  { id: "2b", name: "AppCraft Studio", uen: "202577788L", category: "Technology & IT", district: "Queenstown", address: "71 Ayer Rajah Crescent, Singapore 139951", postalCode: "139951", phone: "+65 6789 3333", description: "Mobile app development and UI/UX design for startups and SMEs.", status: "approved", ownerId: "demo", lat: 1.2966, lng: 103.7870, rating: 4.8, reviewCount: 56, coverImage: tech2, operatingHours: DEFAULT_OPERATING_HOURS },
  { id: "10", name: "Prestige Properties SG", uen: "201700005J", category: "Real Estate", district: "Marina Bay", address: "10 Marina Boulevard, #28-01, Singapore 018983", postalCode: "018983", phone: "+65 6100 5005", website: "https://prestigeproperties.sg", email: "info@prestigeproperties.sg", description: "Luxury residential and commercial property consultancy.", status: "approved", ownerId: "demo", lat: 1.2815, lng: 103.8536, verified: true, featured: true, rating: 4.7, reviewCount: 74, coverImage: realestate1, operatingHours: DEFAULT_OPERATING_HOURS },
  { id: "11", name: "LawPoint LLP", uen: "201600006K", category: "Legal Services", district: "CBD / Raffles Place", address: "50 Collyer Quay, #10-01, Singapore 049321", postalCode: "049321", phone: "+65 6200 6006", website: "https://lawpoint.sg", email: "contact@lawpoint.sg", description: "Corporate law, IP protection, and dispute resolution.", status: "approved", ownerId: "demo", lat: 1.2830, lng: 103.8530, verified: true, rating: 4.8, reviewCount: 51, coverImage: legal1, operatingHours: DEFAULT_OPERATING_HOURS },
  { id: "12", name: "WealthBridge Advisors", uen: "201500007L", category: "Financial Services", district: "Bukit Timah", address: "1 Bukit Timah Road, #09-01, Singapore 229899", postalCode: "229899", phone: "+65 6300 7007", website: "https://wealthbridge.sg", email: "advisory@wealthbridge.sg", description: "Independent financial planning, insurance, and investment advisory.", status: "approved", ownerId: "demo", lat: 1.3100, lng: 103.8150, verified: true, rating: 4.6, reviewCount: 38, coverImage: financial1, operatingHours: DEFAULT_OPERATING_HOURS },
  { id: "13", name: "SwiftMove Logistics", uen: "202100008M", category: "Logistics & Transport", district: "Changi", address: "5 Changi Business Park Ave 1, Singapore 486038", postalCode: "486038", phone: "+65 6400 8008", description: "Same-day delivery, warehousing, and freight forwarding services.", status: "approved", ownerId: "demo", lat: 1.3340, lng: 103.9630, rating: 4.4, reviewCount: 67, coverImage: logistics1, operatingHours: { ...DEFAULT_OPERATING_HOURS, Monday: { open: "07:00", close: "20:00" }, Tuesday: { open: "07:00", close: "20:00" }, Wednesday: { open: "07:00", close: "20:00" }, Thursday: { open: "07:00", close: "20:00" }, Friday: { open: "07:00", close: "20:00" }, Saturday: { open: "08:00", close: "16:00" } } },
  { id: "14", name: "Celebrate! Events Co", uen: "202200009N", category: "Events & Entertainment", district: "Kallang", address: "1 Stadium Place, #03-01, Singapore 397628", postalCode: "397628", phone: "+65 6500 9009", website: "https://celebrateevents.sg", email: "hello@celebrateevents.sg", description: "Full-service event planning for weddings, corporate events, and parties.", status: "approved", ownerId: "demo", lat: 1.3045, lng: 103.8745, verified: true, rating: 4.7, reviewCount: 83, coverImage: events1, operatingHours: DEFAULT_OPERATING_HOURS },
  { id: "15", name: "BuildRight Contractors", uen: "201800010P", category: "Construction & Renovation", district: "Ang Mo Kio", address: "53 Ang Mo Kio Ave 3, #01-01, Singapore 569933", postalCode: "569933", phone: "+65 6600 1010", description: "HDB & condo renovation specialists with 15 years of experience.", status: "approved", ownerId: "demo", lat: 1.3691, lng: 103.8454, verified: true, rating: 4.5, reviewCount: 121, coverImage: construction1, operatingHours: { ...DEFAULT_OPERATING_HOURS, Saturday: { open: "08:00", close: "16:00" } } },
];
