/* ===================================================================
   USER ORBIT MENU — Avatar with dropdown for settings, theme, sign out.
   Space toggles have moved to the Spaces page.
   =================================================================== */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Gear,
  Plugs,
  SignOut,
  Moon,
  Sun,
  Monitor,
  Check,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../lib/auth";
import { useTheme, ACCENT_PRESETS, type AccentId } from "../lib/theme";
import { haptic } from "../lib/haptics";
import { createPortal } from "react-dom";

/* ─── Constants ─── */
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90JTIwc21pbGluZ3xlbnwxfHx8fDE3NzI2NTE3NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

/* ═══════════════════════════════════════════════════════════
   ORBIT AVATAR — user avatar + display name
   ═══════════════════════════════════════════════════════════ */

function OrbitAvatar({
  profile,
  onClick,
  isOpen,
}: {
  profile: { displayName?: string; avatarUrl?: string; avatarColor?: string } | null;
  onClick?: () => void;
  isOpen?: boolean;
}) {
  const avatarSize = 34;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 shrink-0 group cursor-pointer py-1 pl-1.5"
      aria-label="User menu"
      aria-expanded={isOpen}
    >
      {/* User avatar */}
      <div
        className="rounded-full flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-150 group-hover:scale-[1.06]"
        style={{
          width: avatarSize,
          height: avatarSize,
          background: profile?.avatarColor || "#8B5CF6",
          boxShadow: "0 1px 4px oklch(0 0 0 / 0.08)",
          border: "2px solid var(--neutral-200)",
        }}
      >
        {(profile?.avatarUrl || !profile?.displayName) ? (
          <img
            src={profile?.avatarUrl || DEFAULT_AVATAR}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span style={{ color: "white", fontSize: "12px", fontWeight: 700, textShadow: "0 1px 1px oklch(0 0 0 / 0.1)" }}>
            {profile.displayName.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
          </span>
        )}
      </div>

      {/* Display name */}
      <span
        className="text-[13px] font-semibold truncate max-w-[120px]"
        style={{ color: "var(--text-primary)" }}
      >
        {profile?.displayName || "User"}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MENU ITEM — icon + label
   ═══════════════════════════════════════════════════════════ */

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const textColor = danger
    ? "oklch(0.6 0.2 25)"
    : "var(--text-secondary)";

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-[9px] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
    >
      <Icon
        size={18}
        weight="regular"
        style={{ color: textColor, flexShrink: 0 }}
      />
      <span
        className="flex-1 text-left"
        style={{ fontSize: "15px", color: textColor, fontWeight: 500 }}
      >
        {label}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   DIVIDER
   ═══════════════════════════════════════════════════════════ */

function Divider() {
  return (
    <div
      className="my-1.5 mx-4"
      style={{ height: 1, background: "var(--border-default)" }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   THEME MINI-SWITCH
   ═══════════════════════════════════════════════════════════ */

function ThemePill() {
  const { theme, setTheme } = useTheme();
  const modes: { v: "light" | "dark" | "system"; I: React.ElementType; l: string }[] = [
    { v: "light", I: Sun, l: "Light" },
    { v: "dark", I: Moon, l: "Dark" },
    { v: "system", I: Monitor, l: "Auto" },
  ];

  return (
    <div
      className="flex items-center rounded-[8px] p-[3px] gap-[2px] mx-4 my-1.5"
      style={{ background: "var(--neutral-100)" }}
    >
      {modes.map((m) => {
        const active = theme === m.v;
        return (
          <button
            key={m.v}
            onClick={() => { haptic("selection"); setTheme(m.v); }}
            className="flex-1 flex items-center justify-center gap-1 h-[28px] rounded-[6px] transition-all duration-150 text-[12px]"
            style={{
              background: active ? "var(--surface-bg)" : "transparent",
              boxShadow: active ? "0 1px 3px oklch(0 0 0 / 0.06)" : "none",
              color: active ? "var(--text-primary)" : "var(--text-quaternary)",
              fontWeight: active ? 500 : 400,
            }}
          >
            <m.I size={13} weight={active ? "fill" : "regular"} />
            {m.l}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACCENT COLOR PICKER
   ═══════════════════════════════════════════════════════════ */

function AccentPicker() {
  const { accent, setAccent } = useTheme();

  return (
    <div className="px-4 my-2">
      <div
        className="text-[11px] font-medium mb-1.5"
        style={{ color: "var(--text-quaternary)", letterSpacing: "0.02em" }}
      >
        Accent color
      </div>
      <div className="flex items-center gap-2">
        {ACCENT_PRESETS.map((preset) => {
          const active = accent === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => { haptic("selection"); setAccent(preset.id); }}
              className="relative flex items-center justify-center transition-transform duration-100 hover:scale-110"
              style={{ width: 28, height: 28 }}
              title={preset.label}
            >
              <div
                className="rounded-full"
                style={{
                  width: active ? 22 : 20,
                  height: active ? 22 : 20,
                  background: preset.swatch,
                  boxShadow: active
                    ? "0 0 0 2px var(--surface-bg), 0 0 0 3.5px var(--text-tertiary)"
                    : "inset 0 0 0 1px oklch(0 0 0 / 0.06)",
                  transition: "box-shadow 0.15s, width 0.15s, height 0.15s",
                }}
              />
              {active && (
                <Check
                  size={11}
                  weight="bold"
                  className="absolute"
                  style={{ color: "white", filter: "drop-shadow(0 1px 1px oklch(0 0 0 / 0.3))" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT — UserOrbitMenu
   ═══════════════════════════════════════════════════════════ */

interface UserOrbitMenuProps {
  onNavClick: (id: string, params?: Record<string, string>) => void;
}

export function UserOrbitMenu({ onNavClick }: UserOrbitMenuProps) {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  /* ── Position the portal dropdown relative to trigger ── */
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left });
  }, [open]);

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapRef.current && !wrapRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── Close on Escape ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const go = useCallback(
    (action: string, params?: Record<string, string>) => {
      setOpen(false);
      haptic("selection");
      if (action === "signout") signOut();
      else onNavClick(action, params);
    },
    [onNavClick, signOut],
  );

  return (
    <div className="relative" ref={wrapRef}>
      {/* ── Trigger ── */}
      <div ref={triggerRef}>
        <OrbitAvatar
          profile={profile}
          isOpen={open}
          onClick={() => { haptic("light"); setOpen((p) => !p); }}
        />
      </div>

      {/* ── Dropdown menu (portalled to body) ── */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
              className="fixed w-[240px] z-[9999] rounded-[14px] overflow-hidden py-1.5"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                background: "var(--surface-bg)",
                border: "1px solid var(--border-default)",
                boxShadow:
                  "0 -4px 24px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              {/* ── Settings & Integrations ── */}
              <MenuItem icon={Gear} label="Settings" onClick={() => go("settings")} />
              <MenuItem icon={Plugs} label="Integrations" onClick={() => go("settings")} />

              <Divider />

              {/* ── Theme ── */}
              <ThemePill />

              {/* ── Accent color picker ── */}
              <AccentPicker />

              <Divider />

              {/* ── Sign out ── */}
              <MenuItem icon={SignOut} label="Sign out" onClick={() => go("signout")} danger />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}