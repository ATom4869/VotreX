import { padLeft } from "web3-utils";
import { parseEnvNumber } from "~~/components/parseEnvNumber";

export const encryptBirthDate = (birthDate: Date): string => {
    const OFFSET = BigInt(parseEnvNumber(process.env.NEXT_PUBLIC_TIME_OFFSET));;
    const timestamp = BigInt(Math.floor(birthDate.getTime() / 1000));

    const adjusted = timestamp + OFFSET;

    const TWOS_COMPLEMENT_BASE = BigInt(2) ** BigInt(256);
    const finalValue = adjusted < 0n ? TWOS_COMPLEMENT_BASE + adjusted : adjusted;

    const hex = finalValue.toString(16);
    return "0x" + padLeft(hex, 64);
};

export const decryptBirthDate = (encryptedHex: string): Date => {
    const OFFSET = BigInt(parseEnvNumber(process.env.NEXT_PUBLIC_TIME_OFFSET));
    const TWOS_COMPLEMENT_BASE = BigInt(2) ** BigInt(256);

    const raw = BigInt(encryptedHex);

    const adjustedTimestamp = raw >= TWOS_COMPLEMENT_BASE / 2n
      ? raw - TWOS_COMPLEMENT_BASE 
      : raw;

    const originalEpoch = adjustedTimestamp - OFFSET;

    return new Date(Number(originalEpoch) * 1000);
};