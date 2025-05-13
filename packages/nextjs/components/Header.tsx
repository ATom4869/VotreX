"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, BugAntIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
  {
    label: "Documentation",
    href: "https://votrexian.gitbook.io/votrex-docs/",
    icon: <BookOpenIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = ({ isMobile }: { isMobile: boolean }) => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        if (label === "Home" && !isMobile) return null;

        const isActive = pathname === href;

        return (
          <li key={href} className="relative">
            <a
              href={href}
              target={label === "Documentation" ? "_blank" : "_self"}
              rel={label === "Documentation" ? "noopener noreferrer" : undefined}
              className={`py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col transition
                ${isActive ? "bg-transparent" : "hover:bg-accent active:bg-primary"}`}
            >
              {icon}
              <span>{label}</span>

              {label === "Documentation" && (
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="absolute top-1.5 right-1.5 text-xs text-gray-300 opacity-0 transition-opacity duration-0 group-hover:opacity-100"
                />
              )}
            </a>
          </li>
        );
      })}
    </>
  );
};

export const Header = () => {
  const [orgID, setOrgID] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), [])
  );

  useEffect(() => {
    const storedOrgID = localStorage.getItem("orgID");
    if (
      pathname.startsWith("/dashboard") &&
      (pathname.includes("role=admin") || pathname.includes("role=voter"))
    ) {
      setOrgID(storedOrgID || null);
    } else {
      setOrgID(null);
    }
  }, [pathname]);

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2 flex items-center">
        <div className="dropdown lg:hidden" ref={burgerMenuRef}>
          <button
            tabIndex={0}
            className={`ml-1 btn btn-ghost w-14 h-14 flex items-center justify-center
              ${isDrawerOpen ? "bg-accent" : "hover:bg-base-300"} transition`}
            onClick={() => setIsDrawerOpen(prevIsOpenState => !prevIsOpenState)}
          >
            <Bars3Icon className="w-12 h-12" />
          </button>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => setIsDrawerOpen(false)}
            >
              <HeaderMenuLinks isMobile={true} />
            </ul>
          )}
        </div>

        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex relative w-10 h-10">
            <Image alt="VotreX-Logo" className="cursor-pointer" fill src="/VotreX-Logo-potrait.png" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">VotreX System</span>
            <span className="text-xs">Your trusted dApps</span>
          </div>
        </Link>

        <ul className="hidden lg:flex lg:flex-none menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks isMobile={false} />
        </ul>
      </div>

      {pathname.startsWith("/dashboard") &&
        (pathname.includes("role=admin") || pathname.includes("role=voter")) && (
          <div className="text-center p-3 flex bg-base-300 rounded-3xl border border-base-200 items-center">
            <h2 className="text-sm font-bold truncate">
              {orgID ? `${orgID} Dashboard` : "Loading..."}
            </h2>
          </div>
        )}

      <div className="navbar-end flex-grow mr-4 flex items-center gap-2">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
