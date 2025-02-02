"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
// import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import ButtonB from "./main/loginPage/component/ButtonB";
import ButtonA from "~~/components/ButtonA";
import { ToastContainer } from "react-toastify";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
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
            {/* <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              YourContract.sol
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/hardhat/contracts
            </code> */}
          </p>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
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

          {/* <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Go To {" "}
                <Link href="/main" passHref className="link">
                  VotreX System
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Take Control token with {" "}
                <Link href="/votreXTokenAdmin" passHref className="link">
                  Token Dashboard
                </Link>{" "}
                tab.
              </p>
            </div>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default Home;
