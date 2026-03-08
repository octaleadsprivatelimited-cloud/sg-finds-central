import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SINGAPORE_DISTRICTS, BUSINESS_CATEGORIES } from "@/lib/districts";
import { Listing } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminAddBusinessProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (listing: Listing) => void;
  adminUserId: string;
}

const AdminAddBusiness = ({ open, onOpenChange, onCreated, adminUserId }: AdminAddBusinessProps) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [uen, setUen] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"approved" | "pending_approval">("approved");

  const resetForm = () => {
    setName(""); setUen(""); setCategory(""); setDistrict("");
    setAddress(""); setPostalCode(""); setPhone(""); setEmail("");
    setWebsite(""); setDescription(""); setStatus("approved");
  };

  const handleCreate = async () => {
    if (!name || !uen || !category || !district || !address || !postalCode) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const data: Record<string, any> = {
        name, uen, category, district, address, postalCode,
        phone, email, website, description, status,
        ownerId: adminUserId,
        createdAt: serverTimestamp(),
        createdBy: "admin",
      };
      const docRef = await addDoc(collection(db, "listings"), data);
      onCreated({ id: docRef.id, ...data } as Listing);
      toast.success(`Business "${name}" created successfully`);
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create business");
    }
    setSaving(false);
  };

  const categories = BUSINESS_CATEGORIES.filter(c => c !== "All Categories");
  const districts = SINGAPORE_DISTRICTS.filter(d => d !== "All Districts");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add New Business
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Business Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Singapore Delights Pte Ltd" />
          </div>

          <div className="space-y-1.5">
            <Label>UEN *</Label>
            <Input value={uen} onChange={(e) => setUen(e.target.value)} placeholder="e.g. 202312345A" />
          </div>

          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>District *</Label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
              <SelectContent>
                {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Postal Code *</Label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. 238872" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address *</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full street address" />
          </div>

          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+65 6234 5678" />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@business.com" />
          </div>

          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-1.5">
            <Label>Initial Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved (Live)</SelectItem>
                <SelectItem value="pending_approval">Pending Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the business..." rows={3} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
            Create Business
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAddBusiness;
