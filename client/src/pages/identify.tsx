import { CheckCircle2 } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import {
  type ReportDetails,
  ReportSightingForm,
} from "@/components/report-sighting-form";
import { Button } from "@/components/ui/button";
import { WeedCapture } from "@/components/weed-capture";
import {
  type SelectedCandidate,
  WeedResults,
  type WeedResultsStatus,
} from "@/components/weed-results";
import { useIdentifyWeed, useReportSighting } from "@/hooks/weeds";
import { BUSHLAND_FIXTURES, UNSURE_BUSHLAND_ID } from "@/lib/bushland-fixtures";
import type { WeedCandidate } from "@/types/weeds";

const ABUNDANCE_LABELS: Record<ReportDetails["abundance"], string> = {
  single: "Single plant",
  patch: "Small patch",
  widespread: "Widespread",
};

type FlowStep = "capture" | "results" | "report" | "success";

/** What the user confirmed: a specific candidate, or "unidentified" (no
 * confident match, or the user picked "none of these"). */
type ConfirmedOutcome =
  { kind: "candidate"; candidate: WeedCandidate } | { kind: "unidentified" };

function subjectLabelFor(outcome: ConfirmedOutcome): string {
  return outcome.kind === "candidate"
    ? `${outcome.candidate.common_name} (${outcome.candidate.scientific_name})`
    : "Unidentified plant";
}

/** One line summarising AI confidence + that a human confirmed/rejected it. */
function aiConfidenceLabelFor(outcome: ConfirmedOutcome): string {
  if (outcome.kind === "candidate") {
    const { confidence, confidence_level } = outcome.candidate;
    return `${Math.round(confidence * 100)}% AI confidence (${confidence_level}) — species confirmed by you`;
  }
  return "No AI match confirmed — reported for human review";
}

function bushlandLabelFor(bushlandId: string): string {
  if (bushlandId === UNSURE_BUSHLAND_ID)
    return "Not sure / outside listed area";
  const bushland = BUSHLAND_FIXTURES.find((b) => b.slug === bushlandId);
  return bushland ? `${bushland.name} — ${bushland.suburb}` : bushlandId;
}

export default function IdentifyPage() {
  const router = useRouter();
  // Arriving from a Bushland Profile's "Report a weed here" link, e.g.
  // /identify?bushland=bold-park, pre-selects that bushland in the report form.
  const bushlandFromQuery =
    typeof router.query.bushland === "string"
      ? router.query.bushland
      : undefined;

  const [step, setStep] = useState<FlowStep>("capture");
  // Bumping this remounts <WeedCapture>, clearing its internal file/preview
  // state — simpler than exposing an imperative reset API from the component.
  const [captureKey, setCaptureKey] = useState(0);
  const [selectedRank, setSelectedRank] = useState<SelectedCandidate | null>(
    null,
  );
  const [confirmedOutcome, setConfirmedOutcome] =
    useState<ConfirmedOutcome | null>(null);
  const [reportDetails, setReportDetails] = useState<ReportDetails | null>(
    null,
  );
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const identifyMutation = useIdentifyWeed();
  const reportMutation = useReportSighting();

  // Revoke the captured-photo preview URL whenever it changes or the page unmounts.
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const handleSubmit = (file: File) => {
    setStep("results");
    setSelectedRank(null);
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    identifyMutation.mutate({ image: file });
  };

  const handleRetry = () => {
    identifyMutation.reset();
    setSelectedRank(null);
    setConfirmedOutcome(null);
    setReportDetails(null);
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setCaptureKey((key) => key + 1);
    setStep("capture");
  };

  const handleConfirm = () => {
    // "Report as unidentified" for the empty-candidates state doesn't
    // require a selection first.
    const candidates = identifyMutation.data?.candidates ?? [];
    if (candidates.length === 0 || selectedRank === "none") {
      setConfirmedOutcome({ kind: "unidentified" });
      setStep("report");
      return;
    }

    const candidate = candidates.find((c) => c.rank === selectedRank);
    if (!candidate) return;
    setConfirmedOutcome({ kind: "candidate", candidate });
    setStep("report");
  };

  const handleBackToResults = () => {
    setStep("results");
  };

  const handleSubmitReport = (details: ReportDetails) => {
    // The bushland select stores fixture indices as "0"-"3" when no real
    // nearby list is available (no location) — only forward numeric IDs
    // that came from the real backend list (see ReportSightingForm).
    const bushlandId =
      details.bushlandId !== "manual" &&
      details.bushlandId !== UNSURE_BUSHLAND_ID &&
      /^\d+$/.test(details.bushlandId)
        ? Number(details.bushlandId)
        : undefined;

    reportMutation.mutate(
      {
        bushlandId,
        observedOn: details.observationDate,
        abundance: details.abundance,
        latitude: details.latitude,
        longitude: details.longitude,
        notes: details.notes,
        confirmedSpecies: confirmedOutcome ? subjectLabelFor(confirmedOutcome) : "",
        topScientificName:
          confirmedOutcome?.kind === "candidate"
            ? confirmedOutcome.candidate.scientific_name
            : undefined,
        topCommonName:
          confirmedOutcome?.kind === "candidate"
            ? confirmedOutcome.candidate.common_name
            : undefined,
        topConfidence:
          confirmedOutcome?.kind === "candidate"
            ? confirmedOutcome.candidate.confidence
            : undefined,
        modelId: identifyMutation.data?.model_id,
      },
      {
        onSuccess: (data) => {
          setReportDetails({ ...details, ticketId: data.ticket_id });
          setStep("success");
        },
      },
    );
  };

  const resultsStatus: WeedResultsStatus = identifyMutation.isPending
    ? "pending"
    : identifyMutation.isError
      ? "error"
      : identifyMutation.isSuccess
        ? "success"
        : "idle";

  return (
    <>
      <Head>
        <title>Identify a weed</title>
      </Head>
      <AppShell
        title="Identify a weed"
        subtitle="AI field assistant"
        activeTab="identify"
      >
        {step === "capture" && (
          <WeedCapture key={captureKey} onSubmit={handleSubmit} />
        )}

        {step === "results" && (
          <WeedResults
            status={resultsStatus}
            data={identifyMutation.data}
            errorMessage={
              identifyMutation.isError
                ? "We couldn't reach the identification service. Please check your connection and try again."
                : null
            }
            selectedRank={selectedRank}
            onSelectCandidate={setSelectedRank}
            onConfirm={handleConfirm}
            onRetry={handleRetry}
          />
        )}

        {step === "report" && confirmedOutcome && (
          <>
            <ReportSightingForm
              subjectLabel={subjectLabelFor(confirmedOutcome)}
              aiConfidenceLabel={aiConfidenceLabelFor(confirmedOutcome)}
              photoPreviewUrl={photoPreviewUrl}
              initialBushlandId={bushlandFromQuery}
              isSubmitting={reportMutation.isPending}
              onSubmit={handleSubmitReport}
              onBack={handleBackToResults}
            />
            {reportMutation.isError ? (
              <p role="alert" className="text-sm text-destructive">
                We couldn't submit this report. Check your connection and try again.
              </p>
            ) : null}
          </>
        )}

        {step === "success" && confirmedOutcome && reportDetails && (
          <div
            role="status"
            className="flex flex-col gap-4 rounded-md border border-primary/30 bg-primary/5 p-4"
          >
            <div>
              <p className="flex items-center gap-2 font-medium text-primary">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Demo report created
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This demonstration report is stored only for the current session
                and has not been submitted to an official reporting service.
                Persisting real sightings depends on the backend WeedScan
                integration (issue #9).
              </p>
            </div>

            {photoPreviewUrl && (
              <div className="overflow-hidden rounded-md border border-input bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreviewUrl}
                  alt="The photo submitted for this sighting"
                  className="max-h-56 w-full object-contain"
                />
              </div>
            )}

            <dl className="flex flex-col gap-1 text-sm">
              {reportDetails.ticketId && (
                <div>
                  <dt className="inline text-muted-foreground">Ticket ID: </dt>
                  <dd className="inline font-mono font-medium text-foreground">
                    {reportDetails.ticketId}
                  </dd>
                </div>
              )}
              <div>
                <dt className="inline text-muted-foreground">Species: </dt>
                <dd className="inline text-foreground">
                  {subjectLabelFor(confirmedOutcome)}
                </dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">
                  AI confidence:{" "}
                </dt>
                <dd className="inline text-foreground">
                  {aiConfidenceLabelFor(confirmedOutcome)}
                </dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">Bushland: </dt>
                <dd className="inline text-foreground">
                  {reportDetails.bushlandName ||
                    bushlandLabelFor(reportDetails.bushlandId)}
                </dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">
                  Date observed:{" "}
                </dt>
                <dd className="inline text-foreground">
                  {reportDetails.observationDate}
                </dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">Abundance: </dt>
                <dd className="inline text-foreground">
                  {ABUNDANCE_LABELS[reportDetails.abundance]}
                </dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">Location: </dt>
                <dd className="inline text-foreground">
                  {reportDetails.latitude !== undefined &&
                  reportDetails.longitude !== undefined
                    ? `${reportDetails.latitude.toFixed(5)}, ${reportDetails.longitude.toFixed(5)}`
                    : "Not provided"}
                </dd>
              </div>
              {reportDetails.notes && (
                <div>
                  <dt className="inline text-muted-foreground">Notes: </dt>
                  <dd className="inline text-foreground">
                    {reportDetails.notes}
                  </dd>
                </div>
              )}
            </dl>

            <Button
              type="button"
              variant="outline"
              onClick={handleRetry}
              className="self-start"
            >
              Identify another weed
            </Button>
          </div>
        )}
      </AppShell>
    </>
  );
}
