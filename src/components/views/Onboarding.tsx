/**
 * Onboarding Component
 *
 * Displayed when the user has no cases.
 * Provides two options: Create Bundle or Create Affidavit.
 */

import { FileStack, FileText } from "lucide-react";

interface OnboardingProps {
  onCreateCase: (caseType: "bundle" | "affidavit") => void;
}

export function Onboarding({ onCreateCase }: OnboardingProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-2xl w-full px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
            Welcome to CasePilot
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose how you want to get started
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Bundle Option */}
          <button
            onClick={() => onCreateCase("bundle")}
            className="group relative flex flex-col items-center p-8 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 text-left"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
              <FileStack className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">
              New Bundle
            </h2>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Compile multiple PDFs into a paginated court bundle with table of
              contents
            </p>
          </button>

          {/* Affidavit Option */}
          <button
            onClick={() => onCreateCase("affidavit")}
            className="group relative flex flex-col items-center p-8 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 text-left"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">
              New Affidavit
            </h2>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Draft an affidavit with exhibit references and automatic
              pagination
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
