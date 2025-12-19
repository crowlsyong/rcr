// islands/menu/MenuDropdown.tsx
import { useSignal } from "@preact/signals";
import { ComponentType } from "preact";
import { JSX } from "preact/jsx-runtime";
import { TbChevronDown, TbExternalLink } from "@preact-icons/tb";
import { useEffect } from "preact/hooks";

const ChevronDownIcon = TbChevronDown as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const ExternalLinkIcon = TbExternalLink as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

interface Link {
  label: string;
  url?: string;
  targetBlank?: boolean;
  children?: Link[];
  isSpecialNestedDropdown?: boolean;
}

interface MenuDropdownProps {
  title: string;
  links: Link[];
  isMenuOpen: boolean; // Keep this prop for tabIndex and overall visibility control
  isSubmenu?: boolean;
  parentIsSpecialNestedDropdown?: boolean;
  activePath: string;
}

export default function MenuDropdown(
  {
    title,
    links,
    isMenuOpen,
    isSubmenu = false,
    parentIsSpecialNestedDropdown = false,
    activePath,
  }: MenuDropdownProps,
) {
  const isOpen = useSignal(false);

  const containsActivePath = (linksToCheck: Link[]): boolean => {
    return linksToCheck.some((link) => {
      const normalizedLinkUrl = link.url && link.url !== "/"
        ? link.url.replace(/\/$/, "")
        : link.url;
      const normalizedActivePath = activePath && activePath !== "/"
        ? activePath.replace(/\/$/, "")
        : activePath;

      if (normalizedLinkUrl === normalizedActivePath) {
        return true;
      }
      if (link.children && link.children.length > 0) {
        return containsActivePath(link.children);
      }
      return false;
    });
  };

  useEffect(() => {
    // Determine if this dropdown should be open based on activePath, regardless of main menu state.
    // If it contains the active path, set isOpen to true.
    if (containsActivePath(links)) {
      isOpen.value = true;
    } else {
      // Optionally close if active path is no longer within its children.
      // This is important for navigating between active links within the same top-level dropdown.
      isOpen.value = false;
    }
  }, [activePath]); // Re-evaluate whenever the activePath changes

  const shouldApplyOuterIndentation = isSubmenu &&
    !parentIsSpecialNestedDropdown;

  return (
    <div
      class={shouldApplyOuterIndentation
        ? "pl-4 border-l-2 border-gray-700/50"
        : ""}
    >
      <button
        type="button"
        onClick={() => (isOpen.value = !isOpen.value)}
        class={`w-full flex items-center justify-between border border-[#334155] text-white py-2 px-3 rounded-md hover:bg-[#1E293B] transition-colors duration-200 text-sm`}
        tabIndex={isMenuOpen ? 0 : -1}
      >
        <span>{title}</span>
        {typeof window !== "undefined" && (
          <ChevronDownIcon
            class={`w-4 h-4 opacity-70 transition-transform duration-300 ${
              isOpen.value ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
      <div
        class={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen.value ? "mt-2 max-h-[70vh]" : "max-h-0"
        }`}
      >
        <div class="space-y-2 pl-4 border-l-2 border-gray-700/50 max-h-[70vh] overflow-y-auto hide-scrollbar">
          {links.map((link) => {
            if (link.children && link.children.length > 0) {
              return (
                <MenuDropdown
                  key={`${link.label}-submenu`}
                  title={link.label}
                  links={link.children}
                  isMenuOpen={isMenuOpen}
                  isSubmenu
                  parentIsSpecialNestedDropdown={link.isSpecialNestedDropdown}
                  activePath={activePath}
                />
              );
            } else {
              const normalizedLinkUrl = link.url && link.url !== "/"
                ? link.url.replace(/\/$/, "")
                : link.url;
              const normalizedActivePath = activePath && activePath !== "/"
                ? activePath.replace(/\/$/, "")
                : activePath;

              const isActive = normalizedLinkUrl === normalizedActivePath;

              const linkClasses =
                `relative w-full flex items-center justify-start border border-[#334155] text-white py-2 px-3 rounded-md transition-colors duration-200 text-sm ${
                  isActive ? "bg-blue-700" : "hover:bg-[#1E293B]"
                }`;

              return (
                <a
                  key={`${link.label}-${link.url}`}
                  href={link.url}
                  target={link.targetBlank ? "_blank" : "_self"}
                  rel={link.targetBlank ? "noopener noreferrer" : undefined}
                  class={linkClasses}
                  tabIndex={isMenuOpen ? 0 : -1}
                >
                  <span>{link.label}</span>
                  {link.targetBlank && typeof window !== "undefined" && (
                    <ExternalLinkIcon class="absolute right-3 w-4 h-4 opacity-70" />
                  )}
                </a>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
