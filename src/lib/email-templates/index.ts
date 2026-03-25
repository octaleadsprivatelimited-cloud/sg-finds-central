// Business Notification Email Templates
// These templates generate HTML emails ready to be sent via any email provider.
// Enable Lovable Cloud to activate email sending.

export { brand, baseStyles, wrapEmail } from "./base-layout";

// Business lifecycle emails
export { listingApprovedSubject, listingApprovedHtml, type ListingApprovedData } from "./listing-approved";
export { listingRejectedSubject, listingRejectedHtml, type ListingRejectedData } from "./listing-rejected";
export { welcomeSubject, welcomeHtml, type WelcomeEmailData } from "./welcome";
export { listingExpirySubject, listingExpiryHtml, type ListingExpiryData } from "./listing-expiry-reminder";
export { imageApprovedSubject, imageApprovedHtml, type ImageApprovedData } from "./image-approved";
export { imageRejectedSubject, imageRejectedHtml, type ImageRejectedData } from "./image-rejected";

// Auth email templates will be scaffolded when Lovable Cloud is enabled.
// They include: signup confirmation, password recovery, magic link, invite, and email change.
