/* ===================================================================
   PHOSPHOR ICON PICKER — Searchable icon picker for projects.
   Shows suggested icons in categories with a search bar.
   =================================================================== */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Circle,
  Folder,
  FolderOpen,
  Star,
  Heart,
  Lightning,
  Rocket,
  Camera,
  VideoCamera,
  FilmSlate,
  Microphone,
  Headphones,
  MusicNote,
  Palette,
  PaintBrush,
  PencilSimple,
  Pen,
  Notebook,
  BookOpen,
  FileText,
  Files,
  Briefcase,
  Suitcase,
  Buildings,
  House,
  Storefront,
  Package,
  Gift,
  Trophy,
  Medal,
  Crown,
  Target,
  Flag,
  MapPin,
  Compass,
  Globe,
  Airplane,
  Car,
  Bicycle,
  Train,
  Desktop,
  Laptop,
  DeviceMobile,
  Code,
  Terminal,
  Browser,
  Layout,
  Cube,
  Atom,
  Flask,
  Gear,
  Plugs,
  Lightbulb,
  Sun,
  Moon,
  Cloud,
  Drop,
  Leaf,
  Tree,
  Flower,
  Plant,
  Coffee,
  CookingPot,
  ForkKnife,
  Wine,
  Pizza,
  Hamburger,
  Users,
  User,
  UserCircle,
  Handshake,
  ChatCircle,
  EnvelopeSimple,
  Phone,
  Megaphone,
  Broadcast,
  Bell,
  Calendar,
  Clock,
  Timer,
  Hourglass,
  ChartBar,
  ChartLine,
  TrendUp,
  CurrencyDollar,
  Wallet,
  CreditCard,
  Receipt,
  Bank,
  Coins,
  Shield,
  Lock,
  Key,
  Eye,
  GameController,
  PuzzlePiece,
  Sparkle,
  Diamond,
  Fire,
  Snowflake,
  Umbrella,
  Anchor,
  Scissors,
  Stamp,
  Sticker,
  Ticket,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

/* ─── Icon Registry ─── */

export interface IconEntry {
  name: string;
  component: React.ElementType;
  keywords: string[];
  category: string;
}

const ICON_REGISTRY: IconEntry[] = [
  // Media & Production
  { name: "Circle", component: Circle, keywords: ["circle", "dot", "default", "round"], category: "Suggested" },
  { name: "VideoCamera", component: VideoCamera, keywords: ["video", "camera", "film", "record", "production"], category: "Media" },
  { name: "Camera", component: Camera, keywords: ["camera", "photo", "photography", "image", "picture"], category: "Media" },
  { name: "FilmSlate", component: FilmSlate, keywords: ["film", "movie", "slate", "clapper", "production"], category: "Media" },
  { name: "Microphone", component: Microphone, keywords: ["mic", "microphone", "audio", "voice", "podcast"], category: "Media" },
  { name: "Headphones", component: Headphones, keywords: ["headphones", "audio", "music", "listen"], category: "Media" },
  { name: "MusicNote", component: MusicNote, keywords: ["music", "note", "audio", "song"], category: "Media" },
  { name: "Broadcast", component: Broadcast, keywords: ["broadcast", "live", "stream", "radio"], category: "Media" },
  { name: "Megaphone", component: Megaphone, keywords: ["megaphone", "announce", "marketing", "campaign"], category: "Media" },

  // Design & Creative
  { name: "Palette", component: Palette, keywords: ["palette", "color", "art", "design", "creative"], category: "Design" },
  { name: "PaintBrush", component: PaintBrush, keywords: ["paintbrush", "brush", "art", "design", "paint"], category: "Design" },
  { name: "PencilSimple", component: PencilSimple, keywords: ["pencil", "edit", "write", "draw"], category: "Design" },
  { name: "Pen", component: Pen, keywords: ["pen", "write", "sign", "calligraphy"], category: "Design" },
  { name: "Sparkle", component: Sparkle, keywords: ["sparkle", "magic", "ai", "special", "new"], category: "Design" },
  { name: "Diamond", component: Diamond, keywords: ["diamond", "gem", "premium", "luxury", "value"], category: "Design" },
  { name: "Scissors", component: Scissors, keywords: ["scissors", "cut", "edit", "trim"], category: "Design" },
  { name: "Stamp", component: Stamp, keywords: ["stamp", "seal", "approve", "brand"], category: "Design" },
  { name: "Sticker", component: Sticker, keywords: ["sticker", "label", "tag", "fun"], category: "Design" },

  // Business & Work
  { name: "Briefcase", component: Briefcase, keywords: ["briefcase", "business", "work", "job", "office"], category: "Business" },
  { name: "Suitcase", component: Suitcase, keywords: ["suitcase", "travel", "luggage", "trip"], category: "Business" },
  { name: "Buildings", component: Buildings, keywords: ["buildings", "office", "company", "corporate", "city"], category: "Business" },
  { name: "Storefront", component: Storefront, keywords: ["store", "shop", "retail", "commerce"], category: "Business" },
  { name: "Handshake", component: Handshake, keywords: ["handshake", "deal", "agreement", "partnership"], category: "Business" },
  { name: "CurrencyDollar", component: CurrencyDollar, keywords: ["dollar", "money", "currency", "finance", "budget"], category: "Business" },
  { name: "Wallet", component: Wallet, keywords: ["wallet", "money", "payment", "finance"], category: "Business" },
  { name: "Receipt", component: Receipt, keywords: ["receipt", "invoice", "bill", "payment"], category: "Business" },
  { name: "Bank", component: Bank, keywords: ["bank", "finance", "institution", "money"], category: "Business" },
  { name: "Coins", component: Coins, keywords: ["coins", "money", "savings", "finance"], category: "Business" },
  { name: "CreditCard", component: CreditCard, keywords: ["credit card", "payment", "money", "finance"], category: "Business" },
  { name: "ChartBar", component: ChartBar, keywords: ["chart", "graph", "analytics", "data", "stats"], category: "Business" },
  { name: "ChartLine", component: ChartLine, keywords: ["chart", "line", "graph", "trend", "analytics"], category: "Business" },
  { name: "TrendUp", component: TrendUp, keywords: ["trend", "growth", "up", "increase", "analytics"], category: "Business" },

  // Files & Organization
  { name: "Folder", component: Folder, keywords: ["folder", "directory", "organize", "file"], category: "Organization" },
  { name: "FolderOpen", component: FolderOpen, keywords: ["folder", "open", "directory"], category: "Organization" },
  { name: "Notebook", component: Notebook, keywords: ["notebook", "notes", "journal", "write"], category: "Organization" },
  { name: "BookOpen", component: BookOpen, keywords: ["book", "read", "knowledge", "learn", "education"], category: "Organization" },
  { name: "FileText", component: FileText, keywords: ["file", "document", "text", "paper"], category: "Organization" },
  { name: "Files", component: Files, keywords: ["files", "documents", "multiple", "stack"], category: "Organization" },
  { name: "Calendar", component: Calendar, keywords: ["calendar", "date", "schedule", "event"], category: "Organization" },
  { name: "Clock", component: Clock, keywords: ["clock", "time", "schedule", "hours"], category: "Organization" },
  { name: "Timer", component: Timer, keywords: ["timer", "countdown", "stopwatch", "time"], category: "Organization" },
  { name: "Hourglass", component: Hourglass, keywords: ["hourglass", "wait", "time", "patience"], category: "Organization" },
  { name: "Bell", component: Bell, keywords: ["bell", "notification", "alert", "reminder"], category: "Organization" },

  // People & Communication
  { name: "Users", component: Users, keywords: ["users", "team", "group", "people"], category: "People" },
  { name: "User", component: User, keywords: ["user", "person", "profile", "account"], category: "People" },
  { name: "UserCircle", component: UserCircle, keywords: ["user", "avatar", "profile", "circle"], category: "People" },
  { name: "ChatCircle", component: ChatCircle, keywords: ["chat", "message", "talk", "conversation"], category: "People" },
  { name: "EnvelopeSimple", component: EnvelopeSimple, keywords: ["email", "mail", "envelope", "message"], category: "People" },
  { name: "Phone", component: Phone, keywords: ["phone", "call", "contact", "telephone"], category: "People" },

  // Tech & Dev
  { name: "Code", component: Code, keywords: ["code", "programming", "development", "html", "css"], category: "Tech" },
  { name: "Terminal", component: Terminal, keywords: ["terminal", "command", "shell", "cli"], category: "Tech" },
  { name: "Browser", component: Browser, keywords: ["browser", "web", "internet", "website"], category: "Tech" },
  { name: "Desktop", component: Desktop, keywords: ["desktop", "computer", "screen", "monitor"], category: "Tech" },
  { name: "Laptop", component: Laptop, keywords: ["laptop", "computer", "portable"], category: "Tech" },
  { name: "DeviceMobile", component: DeviceMobile, keywords: ["mobile", "phone", "device", "app"], category: "Tech" },
  { name: "Layout", component: Layout, keywords: ["layout", "design", "grid", "template", "ui"], category: "Tech" },
  { name: "Cube", component: Cube, keywords: ["cube", "3d", "object", "model"], category: "Tech" },
  { name: "Atom", component: Atom, keywords: ["atom", "science", "react", "component"], category: "Tech" },
  { name: "Gear", component: Gear, keywords: ["gear", "settings", "configure", "cog"], category: "Tech" },
  { name: "Plugs", component: Plugs, keywords: ["plug", "connect", "integration", "api"], category: "Tech" },

  // Nature & Objects
  { name: "Rocket", component: Rocket, keywords: ["rocket", "launch", "startup", "fast", "speed"], category: "Objects" },
  { name: "Lightning", component: Lightning, keywords: ["lightning", "fast", "power", "energy", "electric"], category: "Objects" },
  { name: "Fire", component: Fire, keywords: ["fire", "hot", "trending", "popular"], category: "Objects" },
  { name: "Heart", component: Heart, keywords: ["heart", "love", "favorite", "health", "wellness"], category: "Objects" },
  { name: "Star", component: Star, keywords: ["star", "favorite", "rating", "important"], category: "Objects" },
  { name: "Trophy", component: Trophy, keywords: ["trophy", "award", "winner", "competition", "prize"], category: "Objects" },
  { name: "Medal", component: Medal, keywords: ["medal", "award", "achievement", "honor"], category: "Objects" },
  { name: "Crown", component: Crown, keywords: ["crown", "king", "queen", "royal", "premium"], category: "Objects" },
  { name: "Target", component: Target, keywords: ["target", "goal", "aim", "objective", "bulls-eye"], category: "Objects" },
  { name: "Flag", component: Flag, keywords: ["flag", "milestone", "mark", "important", "country"], category: "Objects" },
  { name: "Lightbulb", component: Lightbulb, keywords: ["lightbulb", "idea", "creative", "innovation"], category: "Objects" },
  { name: "Shield", component: Shield, keywords: ["shield", "security", "protect", "safe"], category: "Objects" },
  { name: "Key", component: Key, keywords: ["key", "access", "unlock", "security"], category: "Objects" },
  { name: "Lock", component: Lock, keywords: ["lock", "secure", "private", "password"], category: "Objects" },
  { name: "Eye", component: Eye, keywords: ["eye", "view", "watch", "visible", "preview"], category: "Objects" },
  { name: "Gift", component: Gift, keywords: ["gift", "present", "surprise", "reward"], category: "Objects" },
  { name: "Ticket", component: Ticket, keywords: ["ticket", "event", "pass", "admission"], category: "Objects" },
  { name: "Package", component: Package, keywords: ["package", "box", "delivery", "shipping", "product"], category: "Objects" },
  { name: "Umbrella", component: Umbrella, keywords: ["umbrella", "rain", "weather", "protect"], category: "Objects" },
  { name: "Anchor", component: Anchor, keywords: ["anchor", "naval", "stable", "link"], category: "Objects" },

  // Travel & Places
  { name: "Globe", component: Globe, keywords: ["globe", "world", "international", "global", "earth"], category: "Travel" },
  { name: "MapPin", component: MapPin, keywords: ["map", "pin", "location", "place", "gps"], category: "Travel" },
  { name: "Compass", component: Compass, keywords: ["compass", "direction", "navigate", "explore"], category: "Travel" },
  { name: "Airplane", component: Airplane, keywords: ["airplane", "flight", "travel", "plane"], category: "Travel" },
  { name: "Car", component: Car, keywords: ["car", "drive", "vehicle", "transport"], category: "Travel" },
  { name: "Train", component: Train, keywords: ["train", "railway", "transit", "transport"], category: "Travel" },
  { name: "Bicycle", component: Bicycle, keywords: ["bicycle", "bike", "cycle", "sport"], category: "Travel" },
  { name: "House", component: House, keywords: ["house", "home", "residence", "property"], category: "Travel" },

  // Nature
  { name: "Sun", component: Sun, keywords: ["sun", "day", "bright", "weather", "summer"], category: "Nature" },
  { name: "Moon", component: Moon, keywords: ["moon", "night", "dark", "sleep"], category: "Nature" },
  { name: "Cloud", component: Cloud, keywords: ["cloud", "weather", "storage", "sky"], category: "Nature" },
  { name: "Drop", component: Drop, keywords: ["drop", "water", "rain", "liquid"], category: "Nature" },
  { name: "Leaf", component: Leaf, keywords: ["leaf", "nature", "eco", "green", "organic"], category: "Nature" },
  { name: "Tree", component: Tree, keywords: ["tree", "nature", "forest", "growth"], category: "Nature" },
  { name: "Flower", component: Flower, keywords: ["flower", "nature", "bloom", "garden"], category: "Nature" },
  { name: "Plant", component: Plant, keywords: ["plant", "grow", "nature", "garden"], category: "Nature" },
  { name: "Snowflake", component: Snowflake, keywords: ["snowflake", "winter", "cold", "freeze"], category: "Nature" },
  { name: "Flask", component: Flask, keywords: ["flask", "science", "lab", "chemistry", "experiment"], category: "Nature" },

  // Food
  { name: "Coffee", component: Coffee, keywords: ["coffee", "drink", "cafe", "cup", "morning"], category: "Food" },
  { name: "CookingPot", component: CookingPot, keywords: ["cooking", "pot", "food", "kitchen"], category: "Food" },
  { name: "ForkKnife", component: ForkKnife, keywords: ["food", "restaurant", "eat", "dining"], category: "Food" },
  { name: "Wine", component: Wine, keywords: ["wine", "drink", "celebration", "bar"], category: "Food" },
  { name: "Pizza", component: Pizza, keywords: ["pizza", "food", "fast food", "italian"], category: "Food" },
  { name: "Hamburger", component: Hamburger, keywords: ["hamburger", "burger", "food", "fast food"], category: "Food" },

  // Games
  { name: "GameController", component: GameController, keywords: ["game", "controller", "play", "gaming"], category: "Games" },
  { name: "PuzzlePiece", component: PuzzlePiece, keywords: ["puzzle", "piece", "solve", "game"], category: "Games" },
];

/* ─── Suggested icons (curated shortlist shown first) ─── */
const SUGGESTED_ICON_NAMES = [
  "Circle", "VideoCamera", "Camera", "FilmSlate", "Palette",
  "Briefcase", "Rocket", "Lightning", "Star", "Heart",
  "Globe", "Code", "Users", "Lightbulb", "Target",
  "Crown", "Diamond", "Coffee", "Leaf", "Fire",
];

/* ─── Get icon component by name ─── */
export function getPhosphorIcon(name: string): React.ElementType | null {
  const entry = ICON_REGISTRY.find(i => i.name === name);
  return entry?.component || null;
}

/* ─── Component ─── */

interface PhosphorIconPickerProps {
  currentIcon?: string;
  color: string;
  onSelect: (iconName: string) => void;
  /** Render the trigger element */
  children: (props: { onClick: () => void; ref: React.RefObject<HTMLElement | null> }) => React.ReactNode;
}

export function PhosphorIconPicker({ currentIcon, color, onSelect, children }: PhosphorIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Position panel below trigger
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = rect.bottom + 6;
      let left = rect.left;
      // Keep on screen
      if (left + 320 > window.innerWidth) left = window.innerWidth - 328;
      if (left < 8) left = 8;
      if (top + 400 > window.innerHeight) top = rect.top - 406;
      setPos({ top, left });
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setSearch(""); }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  const handleSelect = useCallback((iconName: string) => {
    onSelect(iconName);
    setOpen(false);
    setSearch("");
  }, [onSelect]);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search.trim()) return null; // Show suggested view
    const q = search.toLowerCase().trim();
    return ICON_REGISTRY.filter(entry =>
      entry.name.toLowerCase().includes(q) ||
      entry.keywords.some(k => k.includes(q))
    );
  }, [search]);

  // Build suggested view (when no search)
  const suggestedIcons = useMemo(() => {
    return SUGGESTED_ICON_NAMES.map(name => ICON_REGISTRY.find(i => i.name === name)!).filter(Boolean);
  }, []);

  // Build categorized view for search results
  const categorizedResults = useMemo(() => {
    if (!filteredIcons) return null;
    const cats = new Map<string, IconEntry[]>();
    for (const entry of filteredIcons) {
      if (!cats.has(entry.category)) cats.set(entry.category, []);
      cats.get(entry.category)!.push(entry);
    }
    return Array.from(cats.entries());
  }, [filteredIcons]);

  // All categories for browse
  const allCategories = useMemo(() => {
    const cats = new Map<string, IconEntry[]>();
    for (const entry of ICON_REGISTRY) {
      if (!cats.has(entry.category)) cats.set(entry.category, []);
      cats.get(entry.category)!.push(entry);
    }
    return Array.from(cats.entries());
  }, []);

  return (
    <>
      {children({ onClick: () => setOpen(!open), ref: triggerRef })}
      <AnimatePresence>
        {open && pos && (
          <motion.div
            ref={panelRef}
            className="fixed z-50 rounded-[10px] shadow-xl overflow-hidden"
            style={{
              top: pos.top,
              left: pos.left,
              width: "320px",
              background: "var(--surface-bg)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 12px 40px oklch(0 0 0 / 0.15)",
            }}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
          >
            {/* Search bar */}
            <div className="px-3 pt-3 pb-2">
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px]"
                style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
              >
                <MagnifyingGlass className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-quaternary)" }} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search icons..."
                  className="flex-1 bg-transparent outline-none min-w-0"
                  style={{ color: "var(--text-primary)", fontSize: "13px" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ color: "var(--text-quaternary)" }}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Icon grid */}
            <div className="px-3 pb-3 max-h-[340px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {!search.trim() ? (
                <>
                  {/* Suggested */}
                  <div className="mb-3">
                    <p className="mb-1.5" style={{ color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Suggested
                    </p>
                    <div className="grid grid-cols-8 gap-1">
                      {suggestedIcons.map(entry => {
                        const isActive = currentIcon === entry.name;
                        return (
                          <button
                            key={entry.name}
                            onClick={() => handleSelect(entry.name)}
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors hover:bg-black/[0.06]"
                            style={{
                              background: isActive ? `color-mix(in oklch, ${color} 12%, transparent)` : undefined,
                              color: isActive ? color : "var(--text-secondary)",
                            }}
                            title={entry.name}
                          >
                            <entry.component size={18} weight={isActive ? "fill" : "regular"} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* All categories */}
                  {allCategories.map(([cat, entries]) => (
                    <div key={cat} className="mb-3">
                      <p className="mb-1.5" style={{ color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {cat}
                      </p>
                      <div className="grid grid-cols-8 gap-1">
                        {entries.map(entry => {
                          const isActive = currentIcon === entry.name;
                          return (
                            <button
                              key={entry.name}
                              onClick={() => handleSelect(entry.name)}
                              className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors hover:bg-black/[0.06]"
                              style={{
                                background: isActive ? `color-mix(in oklch, ${color} 12%, transparent)` : undefined,
                                color: isActive ? color : "var(--text-secondary)",
                              }}
                              title={entry.name}
                            >
                              <entry.component size={18} weight={isActive ? "fill" : "regular"} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              ) : filteredIcons && filteredIcons.length > 0 ? (
                categorizedResults?.map(([cat, entries]) => (
                  <div key={cat} className="mb-3">
                    <p className="mb-1.5" style={{ color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {cat}
                    </p>
                    <div className="grid grid-cols-8 gap-1">
                      {entries.map(entry => {
                        const isActive = currentIcon === entry.name;
                        return (
                          <button
                            key={entry.name}
                            onClick={() => handleSelect(entry.name)}
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors hover:bg-black/[0.06]"
                            style={{
                              background: isActive ? `color-mix(in oklch, ${color} 12%, transparent)` : undefined,
                              color: isActive ? color : "var(--text-secondary)",
                            }}
                            title={entry.name}
                          >
                            <entry.component size={18} weight={isActive ? "fill" : "regular"} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p style={{ color: "var(--text-quaternary)", fontSize: "13px" }}>
                    No icons found for "{search}"
                  </p>
                </div>
              )}
            </div>

            {/* Remove icon / Reset */}
            {currentIcon && currentIcon !== "Circle" && (
              <div className="px-3 pb-3 pt-0">
                <button
                  onClick={() => handleSelect("Circle")}
                  className="w-full py-1.5 rounded-[6px] text-center transition-colors hover:bg-black/[0.04]"
                  style={{ color: "var(--text-quaternary)", fontSize: "12px", border: "1px solid var(--border-default)" }}
                >
                  Reset to default
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}