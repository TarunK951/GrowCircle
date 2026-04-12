"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { GrowCircleWordmark } from "@/components/brand/GrowCircleWordmark";
import { AnimatePresence, motion } from "motion/react";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

/** `true` after scrolling past 20vh — floating pill. `false` — full-width bar at top. */
const NavBarFloatingContext = createContext(false);

export function useNavBarFloating() {
  return useContext(NavBarFloatingContext);
}

function scrollPast20vhThreshold(): number {
  if (typeof window === "undefined") return 160;
  return window.innerHeight * 0.2;
}

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
  /**
   * When true, the bar stays full-width at the top and never collapses into the
   * floating pill after scroll (used on the home hero).
   */
  disableFloating?: boolean;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
    active?: boolean;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  /** Reserved for future escape / backdrop handling */
  onClose?: () => void;
}

export const Navbar = ({
  children,
  className,
  disableFloating = false,
}: NavbarProps) => {
  const [scrollFloating, setScrollFloating] = useState(false);

  useEffect(() => {
    if (disableFloating) {
      setScrollFloating(false);
      return;
    }
    const update = () => {
      setScrollFloating(window.scrollY > scrollPast20vhThreshold());
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [disableFloating]);

  const isFloating = disableFloating ? false : scrollFloating;

  return (
    <NavBarFloatingContext.Provider value={isFloating}>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-50 flex w-full justify-center transition-[padding-top,padding-left,padding-right,top] duration-300 ease-out motion-reduce:transition-none",
          isFloating
            ? "top-4 px-4 sm:px-6 lg:px-8"
            : "top-0 px-0",
          className,
        )}
      >
        <div
          className={cn(
            "pointer-events-auto relative isolate min-w-0 w-full max-w-none",
            isFloating && "max-w-6xl",
          )}
        >
          {children}
        </div>
      </div>
    </NavBarFloatingContext.Provider>
  );
};

export const NavBody = ({ children, className }: NavBodyProps) => {
  const isFloating = useNavBarFloating();

  return (
    <div
      data-elevated={isFloating ? "true" : "false"}
      className={cn(
        "nav-liquid-glass relative z-[60] mx-auto hidden min-h-14 w-full min-w-0 flex-row items-center justify-between gap-3 py-2 transition-[padding,box-shadow,border-radius] duration-300 ease-out motion-reduce:transition-none sm:gap-4 md:flex",
        isFloating
          ? "rounded-2xl px-4 sm:px-6 md:px-8"
          : "nav-liquid-glass-full rounded-none px-4 sm:px-6 md:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        // flex-1 centers the cluster; shrink-0 prevents the middle column from
        // collapsing to 0 width when the logo + CTA are wide (links vanished).
        "hidden flex-1 shrink-0 items-center justify-center gap-1 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-800 sm:gap-2 md:flex",
        className,
      )}
    >
      {items.map((item, idx) => (
        <Link
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className={cn(
            "relative px-3 py-2 text-neutral-600 transition-colors dark:text-neutral-300 sm:px-4",
            item.active && "text-primary dark:text-primary",
          )}
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="nav-hover-pill"
              className="absolute inset-0 h-full w-full rounded-md bg-gray-100 dark:bg-neutral-800"
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

export const MobileNav = ({ children, className }: MobileNavProps) => {
  const isFloating = useNavBarFloating();

  return (
    <div
      data-elevated={isFloating ? "true" : "false"}
      className={cn(
        "nav-liquid-glass relative z-50 mx-auto flex w-full min-w-0 shrink-0 flex-col items-stretch justify-between gap-1 py-2 transition-[padding,box-shadow,border-radius] duration-300 ease-out motion-reduce:transition-none md:hidden",
        isFloating
          ? "rounded-2xl px-4 sm:px-6"
          : "nav-liquid-glass-full rounded-none px-4 sm:px-6 md:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "nav-liquid-glass-menu absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 px-4 py-8 text-foreground",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="relative z-[70] rounded-full p-2 text-primary hover:bg-primary/10"
    >
      {isOpen ? (
        <IconX className="size-6" />
      ) : (
        <IconMenu2 className="size-6" />
      )}
    </button>
  );
};

export const NavbarLogo = ({
  href = "/",
  alt = "Grow Circle",
  className,
  wordmarkClassName,
}: {
  href?: string;
  alt?: string;
  className?: string;
  /** Classes merged onto `GrowCircleWordmark` (e.g. larger logo on marketing nav). */
  wordmarkClassName?: string;
}) => {
  return (
    <Link
      href={href}
      aria-label={alt}
      className={cn(
        "relative z-40 mr-1 flex min-w-0 shrink-0 items-center py-0.5 sm:mr-2",
        className,
      )}
    >
      <GrowCircleWordmark
        alt=""
        className={cn("h-8 sm:h-9 md:h-10", wordmarkClassName)}
      />
    </Link>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-2 rounded-md bg-white button bg-white text-black text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    secondary: "bg-transparent shadow-none dark:text-white",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
