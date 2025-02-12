"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BugAntIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

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
    label: "VotreX System",
    href: "/main",
  },
  {
    label: "VotreX Token",
    href: "/VotreXAdminPanel",
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${isActive ? "bg-secondary shadow-md" : ""
                } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  // const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [orgID, setOrgID] = useState<string | null>(null);
  const pathname = usePathname();
  // const burgerMenuRef = useRef<HTMLDivElement>(null);
  // useOutsideClick(
  //   burgerMenuRef,
  //   useCallback(() => setIsDrawerOpen(false), []),
  // );

  useEffect(() => {
    // Fetch OrgID from local storage
    const storedOrgID = localStorage.getItem("orgID");
    if (
      pathname.startsWith("/dashboard") &&
      (pathname.includes("role=admin") || pathname.includes("role=voter"))
    ) {
      if (storedOrgID) {
        setOrgID(storedOrgID);
      } else {
        setOrgID(null);
      }
    } else {
      setOrgID(null);
    }
  }, [pathname]);

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        {/* <div className="dropdown dropdown-start" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => {
              setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div> */}
        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex relative w-10 h-10">
            <Image alt="VotreX-Logo" className="cursor-pointer" fill src="/VotreX-Logo-potrait.png" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">VotreX System</span>
            <span className="text-xs">Your trusted dApps</span>
          </div>
        </Link>
        {/* <ul className="hidden lg:flex lg:flex-none menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul> */}
      </div>
      {/* Conditionally render "OrgID Dashboard" */}
      {pathname.startsWith("/dashboard") &&
        (pathname.includes("role=admin") || pathname.includes("role=voter")) && (
          <div className="text-center p-3 flex bg-base-300 rounded-3xl border border-base-200 items-center">
            <h2 className="text-sm font-bold truncate">
              {orgID ? `${orgID} Dashboard` : "Loading..."}
            </h2>
          </div>
        )}
      <div className="navbar-end flex-grow mr-4">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
