import { useState } from "react";
import { Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SEOHead from "@/components/SEOHead";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, "contact_messages"), {
        name: name.trim().slice(0, 100),
        email: email.trim().slice(0, 255),
        subject: subject.trim().slice(0, 200),
        message: message.trim().slice(0, 2000),
        createdAt: serverTimestamp(),
        status: "unread",
      });
      toast.success("Message sent! We'll get back to you soon.");
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Contact Us" description="Get in touch with FindLocal SG. We're here to help with questions, feedback, or business listing support." />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Contact Us</h1>
          <p className="text-muted-foreground">Have a question or feedback? We'd love to hear from you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-card border border-border rounded-xl p-5 text-center space-y-2">
            <Mail className="w-6 h-6 text-primary mx-auto" />
            <h3 className="font-semibold text-foreground text-sm">Email</h3>
            <p className="text-xs text-muted-foreground">support@findlocal.sg</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center space-y-2">
            <MapPin className="w-6 h-6 text-primary mx-auto" />
            <h3 className="font-semibold text-foreground text-sm">Location</h3>
            <p className="text-xs text-muted-foreground">Singapore</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center space-y-2">
            <Clock className="w-6 h-6 text-primary mx-auto" />
            <h3 className="font-semibold text-foreground text-sm">Response Time</h3>
            <p className="text-xs text-muted-foreground">Within 24 hours</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" maxLength={255} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's this about?" maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us more..." rows={5} maxLength={2000} />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
