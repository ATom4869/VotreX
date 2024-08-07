import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployVotreXToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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

  await deploy("VotreXTokenT2", {
    from: deployer,
    // Contract constructor arguments
    args: [83200000000, 128000000000],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const VotreXToken = await hre.ethers.getContract<Contract>("VotreXTokenT2", deployer);
  console.log("👋 Current Contract Balance", await VotreXToken.balanceOf(VotreXToken));
  const VotreXTokenAddress = await VotreXToken.getAddress();
  console.log("VotreX Token Address: ", VotreXTokenAddress);
  console.log(" ");
  const chainId = await hre.getChainId();
  console.log("current chain id: ", chainId);
};

export default deployVotreXToken;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployVotreXToken.tags = ["VotreXTokenT2"];
