import { Link } from "react-router-dom";
import { Building2, Search, Shield, Star, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";

const features = [
  { icon: Search, title: "Easy Discovery", desc: "Search by category, location, or keyword to find exactly what you need." },
  { icon: Shield, title: "UEN Verified", desc: "Every featured business is verified with their Unique Entity Number." },
  { icon: Star, title: "Ratings & Reviews", desc: "Real reviews from real customers help you make informed decisions." },
  { icon: Zap, title: "Free Listings", desc: "Business owners can list for free and reach thousands of customers." },
  { icon: Users, title: "Community Driven", desc: "Built for Singaporeans, by Singaporeans — supporting local businesses." },
  { icon: Building2, title: "Comprehensive Directory", desc: "From food to healthcare, education to home services — we cover it all." },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="About Us" description="Learn about Nearbuy — Singapore's trusted business directory helping you discover verified local businesses." />

    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About Nearbuy</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Singapore's trusted business directory — connecting customers with verified local businesses since day one.
        </p>
      </div>

      <div className="prose prose-lg max-w-none mb-12">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Our Mission</h2>
          <p className="text-muted-foreground">
            Nearly was created to make it easier for Singaporeans to discover and support local businesses.
            Whether you're looking for a trusted plumber, the best laksa in town, or a reliable tutor for your kids,
            our platform connects you with verified businesses in your neighbourhood.
          </p>
          <p className="text-muted-foreground">
            We believe every local business deserves visibility. That's why listing on Nearly is completely free —
            helping small businesses compete and thrive in the digital age.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground text-center mb-8">Why Nearly?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {features.map((f) => (
          <div key={f.title} className="bg-card border border-border rounded-xl p-5 space-y-2">
            <f.icon className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-foreground">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link to="/add-listing">
          <Button size="lg" className="rounded-full px-8">List Your Business Free</Button>
        </Link>
      </div>
    </div>
  </div>
);

export default About;
