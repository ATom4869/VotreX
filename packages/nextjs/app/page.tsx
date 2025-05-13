"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import ButtonB from "./main/loginPage/component/ButtonB";
import ButtonA from "~~/components/ButtonA";
import { ToastContainer } from "react-toastify";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Selamat Datang di</span>
            <span className="block text-4xl font-bold">VotreX</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Alamat Terhubung:</p>
            <Address address={connectedAddress} />
          </div>
          <p className="text-center text-lg">
            Silahkan melanjutkan navigasi dengan tombol dibawah
          </p>
        </div>

        <div className="flex flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="container mx-auto p-4">
            <div className="flex justify-center mb-4">
              <ButtonB linkDest="/login" buttonLabel="Masuk" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
              <Link href="/register?role=voter" className="link">
                <ButtonA buttonLabel="Daftar sebagai Pemilih" />
              </Link>
              <Link href="/register?role=admin" className="link">
                <ButtonA buttonLabel="Daftar Sebagai Admin" />
              </Link>
            </div>
            <ToastContainer />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
