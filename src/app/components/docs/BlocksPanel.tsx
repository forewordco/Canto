/* ===================================================================
   BLOCKS PANEL — Floating block type insertion grid.
   
   Categories: Text, Lists, Rich, Media, Data, Script (in script mode).
   Items are clickable to insert a new block of that type.
   =================================================================== */

import {
  TextAa,
  TextHOne,
  TextHTwo,
  TextHThree,
  ListBullets,
  ListNumbers,
  CheckSquare,
  CaretRight,
  Quotes,
  Info,
  Code,
  Minus,
  Image as ImageIcon,
  YoutubeLogo,
  Table,
  X,
  FilmScript,
  ChatCentered,
  UserCircle,
  ArrowRight,
  TextT,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { DocBlockType } from "../../lib/types";

interface BlockDef {
  type: DocBlockType;
  label: string;
  icon: React.ElementType;
  level?: number;
}

const TEXT_BLOCKS: BlockDef[] = [
  { type: "paragraph", label: "Body", icon: TextAa },
  { type: "heading", label: "Title", icon: TextHOne, level: 1 },
  { type: "heading", label: "Subtitle", icon: TextHTwo, level: 2 },
  { type: "heading", label: "Heading", icon: TextHThree, level: 3 },
];

const LIST_BLOCKS: BlockDef[] = [
  { type: "bulleted-list", label: "Bullet", icon: ListBullets },
  { type: "numbered-list", label: "Number", icon: ListNumbers },
  { type: "checklist", label: "To-do", icon: CheckSquare },
  { type: "toggle", label: "Toggle", icon: CaretRight },
];

const RICH_BLOCKS: BlockDef[] = [
  { type: "quote", label: "Quote", icon: Quotes },
  { type: "callout", label: "Callout", icon: Info },
  { type: "code", label: "Code", icon: Code },
  { type: "divider", label: "Divider", icon: Minus },
];

const MEDIA_BLOCKS: BlockDef[] = [
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "unsplash-image", label: "Unsplash", icon: ImageIcon },
  { type: "gallery", label: "Gallery", icon: ImageIcon },
  { type: "embed", label: "Video", icon: YoutubeLogo },
];

const DATA_BLOCKS: BlockDef[] = [
  { type: "table", label: "Table", icon: Table },
];

const SCRIPT_BLOCKS: BlockDef[] = [
  { type: "scene-heading", label: "Scene", icon: FilmScript },
  { type: "action", label: "Action", icon: TextAa },
  { type: "character", label: "Character", icon: UserCircle },
  { type: "dialogue", label: "Dialogue", icon: ChatCentered },
  { type: "parenthetical", label: "Parens", icon: TextT },
  { type: "transition", label: "Transition", icon: ArrowRight },
];

interface BlocksPanelProps {
  onClose: () => void;
  onInsertBlock: (type: DocBlockType, level?: number) => void;
  scriptMode?: boolean;
}

export function BlocksPanel({ onClose, onInsertBlock, scriptMode = false }: BlocksPanelProps) {
  const sections = scriptMode
    ? [
        { label: "Text", items: TEXT_BLOCKS },
        { label: "Lists", items: LIST_BLOCKS },
        { label: "Script", items: SCRIPT_BLOCKS },
        { label: "Rich", items: RICH_BLOCKS },
      ]
    : [
        { label: "Text", items: TEXT_BLOCKS },
        { label: "Lists", items: LIST_BLOCKS },
        { label: "Rich", items: RICH_BLOCKS },
        { label: "Media", items: MEDIA_BLOCKS },
        { label: "Data", items: DATA_BLOCKS },
      ];

  return (
    <motion.div
      className="w-64 rounded-[10px] shadow-lg border overflow-hidden"
      style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.12 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border-default)" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
          Blocks
        </span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5" style={{ color: "var(--text-quaternary)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-2 space-y-3 max-h-80 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <div
              className="mb-1.5 px-1"
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-quaternary)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {section.label}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {section.items.map((item) => (
                <button
                  key={`${item.type}-${item.level || ""}`}
                  onClick={() => {
                    onInsertBlock(item.type, item.level);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  title={item.label}
                >
                  <div
                    className="w-7 h-7 rounded-[5px] flex items-center justify-center"
                    style={{ background: "var(--neutral-100)" }}
                  >
                    <item.icon
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </div>
                  <span
                    className="truncate w-full text-center"
                    style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 500 }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default BlocksPanel;