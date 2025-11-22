import React from "react";
import { Modal, Badge, Button } from "./ui";
import { MedicalAssessment } from "../types";
import { AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";

interface ViewAssessmentModalProps {
  assessment: MedicalAssessment | null;
  onClose: () => void;
}

export const ViewAssessmentModal = ({
  assessment,
  onClose,
}: ViewAssessmentModalProps) => {
  if (!assessment) return null;

  return (
    <Modal
      isOpen={!!assessment}
      onClose={onClose}
      title="Medical Assessment Details"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {assessment.is_cow_sick ? (
                <AlertTriangle className="text-rose-500 h-5 w-5" />
              ) : (
                <CheckCircle2 className="text-emerald-500 h-5 w-5" />
              )}
              Cow:{" "}
              {typeof assessment.cow === "string"
                ? assessment.cow
                : (assessment.cow as any).cow_id}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Assessment Date:{" "}
              {new Date(assessment.assessment_date).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={assessment.is_cow_sick ? "danger" : "success"}>
            {assessment.is_cow_sick ? "Sick" : "Healthy"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Clinical Findings
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block">General Health</span>
                {typeof assessment.general_health === "object"
                  ? assessment.general_health.name
                  : assessment.general_health}
              </div>
              <div>
                <span className="text-slate-500 block">Udder Health</span>
                {typeof assessment.udder_health === "object"
                  ? assessment.udder_health.name
                  : assessment.udder_health}
              </div>
              <div>
                <span className="text-slate-500 block">Mastitis</span>
                {typeof assessment.mastitis === "object"
                  ? assessment.mastitis.name
                  : assessment.mastitis}
              </div>
              <div>
                <span className="text-slate-500 block">Lameness</span>
                {assessment.has_lameness ? (
                  <span className="text-rose-500">Yes</span>
                ) : (
                  "No"
                )}
              </div>
              <div>
                <span className="text-slate-500 block">BCS</span>
                <span className="font-bold">
                  {assessment.body_condition_score}
                </span>
                /5
              </div>
              {assessment.sickness_type && (
                <div>
                  <span className="text-slate-500 block">Sickness Type</span>
                  <span className="capitalize">
                    {assessment.sickness_type.replace("_", " ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Treatments
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Vaccinated?</span>
                <span>
                  {assessment.is_cow_vaccinated
                    ? `Yes (${assessment.vaccination_type})`
                    : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dewormed?</span>
                <span>
                  {assessment.has_deworming
                    ? `Yes (${assessment.deworming_type})`
                    : "No"}
                </span>
              </div>
              {assessment.diagnosis && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block text-xs font-bold mb-1">
                    DIAGNOSIS
                  </span>
                  {assessment.diagnosis}
                </div>
              )}
            </div>
          </div>
        </div>

        {(assessment.treatment ||
          assessment.prescription ||
          assessment.notes) && (
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
            <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Medical Notes & Prescription
            </h4>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {assessment.treatment && (
                <p>
                  <strong>Treatment:</strong> {assessment.treatment}
                </p>
              )}
              {assessment.prescription && (
                <p>
                  <strong>Rx:</strong> {assessment.prescription}
                </p>
              )}
              {assessment.notes && (
                <p>
                  <strong>Notes:</strong> {assessment.notes}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close Record</Button>
        </div>
      </div>
    </Modal>
  );
};
