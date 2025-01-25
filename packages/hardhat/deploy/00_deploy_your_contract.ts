import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployBettingManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const deployment = await deploy("BettingManager", {
    from: deployer,
    args: [],
    autoMine: true,
  });

  log(`👋 BettingManager deployed at address: ${deployment.address}`);
  log(`👋 Contract deployed by: ${deployer}`);
};

export default deployBettingManager;

deployBettingManager.tags = ["BettingManager"];
