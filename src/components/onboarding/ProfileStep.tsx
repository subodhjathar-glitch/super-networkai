import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ScrollableSelect from "./inputs/ScrollableSelect";
import TagInput from "./inputs/TagInput";
import { INDUSTRIES, COUNTRIES, SKILLS } from "./constants";

export interface ProfileData {
  name: string;
  location_country: string;
  location_city: string;
  industries: string[];
  industry_other: string;
  skills: string[];
  linkedin?: string;
  twitter?: string;
  github?: string;
  portfolio?: string;
  cvUploaded?: boolean;
}

interface Props {
  data: ProfileData;
  onChange: (data: ProfileData) => void;
  onNext: () => void;
  onBack: () => void;
}

const ProfileStep = ({ data, onChange, onNext, onBack }: Props) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const update = (partial: Partial<ProfileData>) => {
    onChange({ ...data, ...partial });
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File too large. Max 10MB.");
      return;
    }

    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a PDF or Word document.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/cv.${ext}`;

    const { error } = await supabase.storage.from("cvs").upload(filePath, file, { upsert: true });

    if (error) {
      console.error("CV upload error:", error);
      toast.error("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    // Save the path to profile
    await supabase.from("profiles").update({ cv_url: filePath }).eq("user_id", user.id);

    setCvFileName(file.name);
    update({ cvUploaded: true });
    toast.success("CV uploaded successfully!");
    setUploading(false);
  };

  const hasCv = data.cvUploaded || !!cvFileName;
  const hasName = data.name.trim().length > 0;
  const hasLocation = !!(data.location_country || data.location_city.trim());
  const hasIndustry = data.industries.length > 0 || data.industry_other.trim().length > 0;
  const hasSkills = data.skills.length > 0;
  const canProceed = hasName && hasLocation && hasIndustry && hasSkills && hasCv;

  const handleNext = () => {
    setAttempted(true);
    if (!canProceed) {
      const missing: string[] = [];
      if (!hasName) missing.push("Full name");
      if (!hasLocation) missing.push("Location");
      if (!hasIndustry) missing.push("Industry");
      if (!hasSkills) missing.push("Skills");
      if (!hasCv) missing.push("CV upload");
      toast.error(`Please complete: ${missing.join(", ")}`);
      return;
    }
    onNext();
  };

  const fieldError = (valid: boolean) =>
    attempted && !valid ? "border-destructive/50" : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-800 text-foreground mb-2">
          Your profile
        </h1>
        <p className="text-muted-foreground text-lg">
          Help us understand your professional background. All fields marked with <span className="text-destructive">*</span> are required.
        </p>
      </div>

      <div className="space-y-6">
        {/* Full name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Full name <span className="text-destructive">*</span>
          </label>
          <Input
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Your full name"
            className={`h-12 ${fieldError(hasName)}`}
          />
          {attempted && !hasName && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Full name is required
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Location <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <ScrollableSelect
              options={COUNTRIES}
              selected={data.location_country ? [data.location_country] : []}
              onChange={(sel) => update({ location_country: sel[0] || "" })}
              placeholder="Search country..."
              multi={false}
              allowOther={false}
            />
            <div>
              <Input
                value={data.location_city}
                onChange={(e) => update({ location_city: e.target.value })}
                placeholder="City"
                className="h-10"
              />
            </div>
          </div>
          {attempted && !hasLocation && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Please provide at least a country or city
            </p>
          )}
        </div>

        {/* Industry */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Primary industry <span className="text-destructive">*</span>
          </label>
          <ScrollableSelect
            options={INDUSTRIES}
            selected={data.industries}
            onChange={(sel) => update({ industries: sel })}
            placeholder="Search industries..."
            multi={true}
            allowOther={true}
            otherValue={data.industry_other}
            onOtherChange={(val) => update({ industry_other: val })}
          />
          {attempted && !hasIndustry && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Select at least one industry or describe yours
            </p>
          )}
        </div>

        {/* Skills / Domain */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Skills & specialisation <span className="text-destructive">*</span>
          </label>
          <TagInput
            suggestions={SKILLS}
            tags={data.skills}
            onChange={(tags) => update({ skills: tags })}
            placeholder="Type to search skills or add your own..."
          />
          {attempted && !hasSkills && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Add at least one skill
            </p>
          )}
        </div>

        {/* Social links - optional */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Social links <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={data.linkedin || ""}
              onChange={(e) => update({ linkedin: e.target.value })}
              placeholder="LinkedIn URL"
              className="h-10"
            />
            <Input
              value={data.twitter || ""}
              onChange={(e) => update({ twitter: e.target.value })}
              placeholder="Twitter / X"
              className="h-10"
            />
            <Input
              value={data.github || ""}
              onChange={(e) => update({ github: e.target.value })}
              placeholder="GitHub"
              className="h-10"
            />
            <Input
              value={data.portfolio || ""}
              onChange={(e) => update({ portfolio: e.target.value })}
              placeholder="Portfolio URL"
              className="h-10"
            />
          </div>
        </div>

        {/* CV Upload area — MANDATORY */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            CV Upload <span className="text-destructive">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleCvUpload}
          />
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer bg-card ${
              cvFileName || data.cvUploaded
                ? "border-accent/60"
                : attempted && !hasCv
                ? "border-destructive/50"
                : "border-border hover:border-accent/40"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-accent mx-auto mb-3 animate-spin" />
                <p className="text-sm text-foreground font-medium mb-1">Uploading...</p>
              </>
            ) : cvFileName || data.cvUploaded ? (
              <>
                <CheckCircle className="w-8 h-8 text-accent mx-auto mb-3" />
                <p className="text-sm text-foreground font-medium mb-1">{cvFileName || "CV uploaded"}</p>
                <p className="text-xs text-muted-foreground">Click to replace</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground font-medium mb-1">Drop your CV here or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  PDF or Word document, max 10MB. <span className="text-destructive font-medium">Required</span> — makes your matches significantly more accurate.
                </p>
              </>
            )}
          </div>
          {attempted && !hasCv && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> CV upload is required for accurate matching
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="h-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12 text-base"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default ProfileStep;
