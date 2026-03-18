/* ===================================================================
   PROJECT CREATION WIZARD — Multi-step modal for creating projects.

   Steps:
   1. Name & Client — project name, short name, client, description
   2. Type & Phase — project type, production phase, status
   3. Appearance — icon (emoji), color picker, banner image

   Phase 6 of Canto build plan (P6-1).
   =================================================================== */

import { useState, useCallback, useRef } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkle,
  SquareHalf,
  Check,
  ImageSquare,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import { ResponsiveModal } from "./ResponsiveModal";
import {
  PROJECT_TYPE_OPTIONS,
  TASK_PHASE_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  type ProjectData,
  type ProjectType,
  type ProductionPhase,
  type ProjectStatus,
} from "../lib/types";
import { haptic } from "../lib/haptics";
import { SpacePicker } from "./SpacePicker";
import { PhosphorIconPicker, getPhosphorIcon } from "./PhosphorIconPicker";
import { ProjectIcon } from "./ProjectIcon";

/* ─── Color Presets ─── */
const COLOR_PRESETS = [
  { name: "Coral", value: "oklch(0.7 0.18 25)" },
  { name: "Peach", value: "oklch(0.78 0.13 55)" },
  { name: "Gold", value: "oklch(0.85 0.15 85)" },
  { name: "Lime", value: "oklch(0.78 0.15 130)" },
  { name: "Emerald", value: "oklch(0.65 0.15 155)" },
  { name: "Teal", value: "oklch(0.65 0.15 180)" },
  { name: "Sky", value: "oklch(0.7 0.14 230)" },
  { name: "Indigo", value: "oklch(0.55 0.2 280)" },
  { name: "Violet", value: "oklch(0.6 0.16 300)" },
  { name: "Fuchsia", value: "oklch(0.65 0.18 320)" },
  { name: "Rose", value: "oklch(0.72 0.15 350)" },
  { name: "Slate", value: "oklch(0.55 0.02 260)" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** If provided, pre-fill with this project for duplication */
  duplicateFrom?: ProjectData & { originalName: string };
}

export function ProjectCreationWizard({ open, onClose, duplicateFrom }: Props) {
  const { setProject, projects, clients } = useData();
  const { navigate } = useNavigation();

  // Form state
  const [step, setStep] = useState(0);
  const [name, setName] = useState(duplicateFrom?.name ? `${duplicateFrom.shortName || duplicateFrom.name} (Copy)` : "");
  const [shortName, setShortName] = useState(duplicateFrom?.shortName || "");
  const [client, setClient] = useState(duplicateFrom?.client || "");
  const [description, setDescription] = useState(duplicateFrom?.description || "");
  const [projectType, setProjectType] = useState<ProjectType>(duplicateFrom?.projectType || "video-production");
  const [phase, setPhase] = useState<ProductionPhase>(duplicateFrom?.productionPhase || "incoming");
  const [status, setStatus] = useState<ProjectStatus>(duplicateFrom?.status || "on-track");
  const [icon, setIcon] = useState(duplicateFrom?.icon || "📁");
  const [phosphorIcon, setPhosphorIcon] = useState(duplicateFrom?.phosphorIcon || "SquareHalf");
  const [color, setColor] = useState(duplicateFrom?.color || COLOR_PRESETS[0].value);
  const [spaceId, setSpaceId] = useState<string | undefined>(duplicateFrom?.spaceId);

  const nameRef = useRef<HTMLInputElement>(null);

  const STEPS = ["Details", "Classification", "Appearance"];

  const isNameValid = name.trim().length > 0 && !projects[name.trim()];
  const nameError = name.trim().length > 0 && projects[name.trim()] ? "A project with this name already exists" : "";

  const canProceed = step === 0 ? isNameValid : true;

  const handleCreate = useCallback(() => {
    const projectName = name.trim();
    if (!projectName || projects[projectName]) return;

    haptic("success");
    const newProject: ProjectData = {
      name: projectName,
      shortName: shortName.trim() || undefined,
      description: description.trim(),
      tasks: duplicateFrom?.tasks ? [...duplicateFrom.tasks] : [],
      notes: duplicateFrom?.notes ? [...duplicateFrom.notes] : [],
      updates: [],
      timelineDates: duplicateFrom?.timelineDates ? [...duplicateFrom.timelineDates] : [],
      status,
      bannerImage: duplicateFrom?.bannerImage || "",
      client: client.trim(),
      color,
      icon,
      phosphorIcon,
      projectAttachments: duplicateFrom?.projectAttachments ? [...duplicateFrom.projectAttachments] : [],
      productionPhase: phase,
      projectType,
      tagPalette: duplicateFrom?.tagPalette ? [...duplicateFrom.tagPalette] : [],
      spaceId,
    };

    setProject(projectName, newProject);
    onClose();
    // Navigate to the new project
    navigate("project", { projectId: projectName });
  }, [name, shortName, description, status, client, color, icon, phosphorIcon, phase, projectType, projects, setProject, onClose, navigate, duplicateFrom, spaceId]);

  if (!open) return null;

  // Unique client names from existing projects + clients list
  const allClients = Array.from(
    new Set([
      ...Object.values(projects).map((p) => p.client).filter(Boolean),
      ...(Array.isArray(clients) ? clients.map((c) => c.name).filter(Boolean) : []),
    ])
  ).sort();

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      hideClose
      desktopMaxWidth="520px"
      snapPoints={["90vh"]}
      fullScreen
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center"
            style={{ background: "var(--accent-primary-subtle)" }}
          >
            <SquareHalf className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          </div>
          <div>
            <h2 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>
              {duplicateFrom ? "Duplicate Project" : "New Project"}
            </h2>
            <p style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors hidden md:flex"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              background: i <= step ? "var(--accent-primary)" : "var(--neutral-200)",
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[260px]">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Project Name */}
              <div>
                <label
                  className="block mb-1.5"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Project Name *
                </label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Brand Video 2026"
                  autoFocus
                  className="w-full px-3 py-2 rounded-[6px] outline-none transition-shadow"
                  style={{
                    background: "var(--neutral-50)",
                    border: `1px solid ${nameError ? "oklch(0.7 0.18 25)" : "var(--border-default)"}`,
                    color: "var(--text-primary)",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px var(--accent-primary-subtle)`)}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                />
                {nameError && (
                  <p style={{ color: "oklch(0.7 0.18 25)", fontSize: "12px", marginTop: "4px" }}>
                    {nameError}
                  </p>
                )}
              </div>

              {/* Short Name */}
              <div>
                <label
                  className="block mb-1.5"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Short Name
                </label>
                <input
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="e.g. BV2026 (optional)"
                  className="w-full px-3 py-2 rounded-[6px] outline-none transition-shadow"
                  style={{
                    background: "var(--neutral-50)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px var(--accent-primary-subtle)`)}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                />
              </div>

              {/* Client */}
              <div>
                <label
                  className="block mb-1.5"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Client
                </label>
                <input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Client name (optional)"
                  list="client-suggestions"
                  className="w-full px-3 py-2 rounded-[6px] outline-none transition-shadow"
                  style={{
                    background: "var(--neutral-50)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px var(--accent-primary-subtle)`)}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                />
                <datalist id="client-suggestions">
                  {allClients.map((c, i) => (
                    <option key={`${c}-${i}`} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Description */}
              <div>
                <label
                  className="block mb-1.5"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief project description (optional)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-[6px] outline-none transition-shadow resize-none"
                  style={{
                    background: "var(--neutral-50)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                  onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px var(--accent-primary-subtle)`)}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                />
              </div>

              {/* Space Assignment */}
              <div>
                <label
                  className="block mb-1.5"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Space
                </label>
                <SpacePicker
                  value={spaceId}
                  onChange={setSpaceId}
                  label="Choose a space (optional)"
                />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Project Type */}
              <div>
                <label
                  className="block mb-1.5"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Project Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setProjectType(opt.value)}
                      className="px-3 py-2 rounded-[6px] text-left transition-colors"
                      style={{
                        border: `1.5px solid ${projectType === opt.value ? "var(--accent-primary)" : "var(--border-default)"}`,
                        background: projectType === opt.value ? "var(--accent-primary-subtle)" : "var(--neutral-50)",
                        color: projectType === opt.value ? "var(--accent-primary)" : "var(--text-secondary)",
                        fontSize: "13px",
                        fontWeight: projectType === opt.value ? 500 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Production Phase */}
              <div>
                <label
                  className="block mb-1.5"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Production Phase
                </label>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as ProductionPhase)}
                  className="w-full px-3 py-2 rounded-[6px] outline-none"
                  style={{
                    background: "var(--neutral-50)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                  }}
                >
                  {TASK_PHASE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label
                  className="block mb-1.5"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-colors"
                      style={{
                        border: `1.5px solid ${status === opt.value ? opt.color : "var(--border-default)"}`,
                        background: status === opt.value ? `${opt.color}15` : "var(--neutral-50)",
                        color: status === opt.value ? opt.color : "var(--text-tertiary)",
                        fontSize: "13px",
                        fontWeight: status === opt.value ? 500 : 400,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: opt.color }}
                      />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* Preview */}
              <div className="flex items-center gap-3">
                <ProjectIcon
                  phosphorIcon={phosphorIcon}
                  color={color}
                  size="lg"
                  className="shadow-sm"
                />
                <div>
                  <p style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>
                    {name.trim() || "Untitled Project"}
                  </p>
                  {client && (
                    <p style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>{client}</p>
                  )}
                </div>
              </div>

              {/* Icon selector */}
              <div>
                <label
                  className="block mb-2"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Icon
                </label>
                <PhosphorIconPicker
                  currentIcon={phosphorIcon}
                  color={color}
                  onSelect={(iconName) => { haptic("selection"); setPhosphorIcon(iconName); }}
                >
                  {({ onClick, ref }) => {
                    const SelectedIcon = getPhosphorIcon(phosphorIcon) || SquareHalf;
                    return (
                      <button
                        ref={ref as React.RefObject<HTMLButtonElement>}
                        onClick={onClick}
                        className="inline-flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer"
                        style={{
                          border: "1.5px solid var(--border-default)",
                          background: "var(--neutral-50)",
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-[5px] flex items-center justify-center"
                          style={{ background: `color-mix(in oklch, ${color} 12%, transparent)` }}
                        >
                          <SelectedIcon size={16} weight="fill" style={{ color }} />
                        </div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                          {phosphorIcon || "Choose icon"}
                        </span>
                      </button>
                    );
                  }}
                </PhosphorIconPicker>
              </div>

              {/* Color selector */}
              <div>
                <label
                  className="block mb-2"
                  style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
                >
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { haptic("selection"); setColor(c.value); }}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c.value,
                        boxShadow: color === c.value ? `0 0 0 2px var(--surface-bg), 0 0 0 4px ${c.value}` : "none",
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-4 mt-4 border-t"
        style={{ borderColor: "var(--border-default)" }}
      >
        <button
          onClick={step === 0 ? onClose : () => { haptic("light"); setStep(step - 1); }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => { haptic("light"); setStep(step + 1); }}
            disabled={!canProceed}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-white transition-opacity"
            style={{
              background: "var(--accent-primary)",
              fontSize: "13px",
              fontWeight: 500,
              opacity: canProceed ? 1 : 0.5,
              cursor: canProceed ? "pointer" : "not-allowed",
            }}
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={!isNameValid}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-white transition-opacity"
            style={{
              background: "var(--accent-primary)",
              fontSize: "13px",
              fontWeight: 500,
              opacity: isNameValid ? 1 : 0.5,
              cursor: isNameValid ? "pointer" : "not-allowed",
            }}
          >
            <Sparkle className="w-4 h-4" weight="fill" />
            {duplicateFrom ? "Create Copy" : "Create Project"}
          </button>
        )}
      </div>
    </ResponsiveModal>
  );
}

export default ProjectCreationWizard;