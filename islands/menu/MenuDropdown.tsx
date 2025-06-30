// islands/menu/MenuDropdown.tsx
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
  isMenuOpen: boolean;
  isSubmenu?: boolean;
  parentIsSpecialNestedDropdown?: boolean;
}

export default function MenuDropdown(
  {
    title,
    links,
    isMenuOpen,
    isSubmenu = false,
    parentIsSpecialNestedDropdown = false,
  }: MenuDropdownProps,
) {
  const isOpen = useSignal(false);
  const currentPath = useSignal("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      currentPath.value = globalThis.location.pathname;
    }
  }, []);

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
          isOpen.value ? "max-h-96 mt-2" : "max-h-0"
        }`}
      >
        <div class="space-y-2 pl-4 border-l-2 border-gray-700/50">
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
                />
              );
            } else {
              const isActive = currentPath.value === link.url;
              const linkClasses =
                `relative flex items-center justify-start border border-[#334155] text-white py-2 px-3 rounded-md transition-colors duration-200 text-sm ${
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
