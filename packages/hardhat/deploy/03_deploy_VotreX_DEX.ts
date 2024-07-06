import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import deployVotreXInterface from "./01_deploy_VotreX_Interface";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployVotreXDex: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  console.log("Deployed from address: ", `${deployer}`);
  const { deploy } = hre.deployments;
  const Interface = await hre.ethers.getContract<Contract>("VotreXTXInterface", deployer);
  const InterfaceAddress = await Interface.getAddress();

  await deploy("VotreXDex", {
    from: deployer,
    // Contract constructor arguments
    args: [`${InterfaceAddress}`],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
    gasLimit: "5550000",
  });

  // Get the deployed contract to interact with it after deploying.
  const VotreXDex = await hre.ethers.getContract<Contract>("VotreXDex", deployer);
  const VotreXDexAddress = await VotreXDex.getAddress();
  console.log("VotreX Dex Address: ", VotreXDexAddress);
  console.log(" ");
};

export default deployVotreXDex;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployVotreXDex.tags = ["VotreXDex"];
