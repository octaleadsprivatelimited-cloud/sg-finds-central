import { useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BusinessEnquiryFormProps {
  listingId: string;
  listingName: string;
  ownerId: string;
}

const BusinessEnquiryForm = ({ listingId, listingName, ownerId }: BusinessEnquiryFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Please fill in name and mobile number");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, "enquiries"), {
        listingId,
        listingName,
        ownerId,
        name: name.trim().slice(0, 100),
        email: email.trim().slice(0, 255),
        phone: phone.trim().slice(0, 20),
        message: message.trim().slice(0, 2000),
        createdAt: serverTimestamp(),
        status: "unread",
      });
      setSent(true);
      toast.success("Enquiry sent successfully!");
    } catch {
      toast.error("Failed to send enquiry. Please try again.");
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
          <Send className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">Enquiry Sent!</h3>
        <p className="text-sm text-muted-foreground mb-3">The business owner will get back to you soon.</p>
        <Button variant="outline" size="sm" onClick={() => { setSent(false); setName(""); setEmail(""); setPhone(""); setMessage(""); }}>
          Send Another
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        Send Enquiry
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="h-9 text-sm" maxLength={100} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mobile Number *</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+65 xxxx xxxx" className="h-9 text-sm" maxLength={20} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com (optional)" className="h-9 text-sm" maxLength={255} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Message</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="I'd like to enquire about... (optional)" rows={3} className="text-sm" maxLength={2000} />
        </div>
        <Button type="submit" className="w-full h-9 text-sm" disabled={sending}>
          <Send className="w-3.5 h-3.5 mr-1.5" />
          {sending ? "Sending..." : "Send Enquiry"}
        </Button>
      </form>
    </div>
  );
};

export default BusinessEnquiryForm;
