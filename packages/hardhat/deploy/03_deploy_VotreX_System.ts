import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployVotreXSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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
  const  TIME_OFFSET = BigInt(Number(process.env.TIME_OFFSET));

  const dateTime = await deploy("UtilityLibrary", {
    from: deployer,
    log: true,
  });

  await deploy("VotreXSysA2", {
    from: deployer,
    // Contract constructor arguments
    args: [TIME_OFFSET],
    log: true,
    libraries: {
      DateTime: dateTime.address,
    },
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
    gasLimit: "5300000",
  });

  // Get the deployed contract to interact with it after deploying.
  const VotreXSystem = await hre.ethers.getContract<Contract>("VotreXSysA2", deployer);
  const VotreXSystemAddress = await VotreXSystem.getAddress();
  const OwnerName = await VotreXSystem.getOwnerName();
  const VotreXSystemStatus = await VotreXSystem.isVotreXActivated();
  const formattedVotreXStatus = VotreXSystemStatus ? "Active" : "Paused";
  console.log("VotreX System Address: ", VotreXSystemAddress);
  console.log("VotreX System Owner Name: ", OwnerName);
  console.log("VotreX System Status: ", formattedVotreXStatus);
  console.log(" ");
};

export default deployVotreXSystem;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployVotreXSystem.tags = ["VotreXSysA2"];
