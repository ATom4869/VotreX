import { encodePacked } from "web3-utils";

function padToBytes32(str: string): string {
    const encoded = Buffer.from(str).toString('hex');
    return '0x' + encoded.padEnd(64, '0');
}

export default padToBytes32;