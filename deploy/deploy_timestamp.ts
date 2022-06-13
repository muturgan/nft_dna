import { DeployFunction } from 'hardhat-deploy/types';

const deployFunction: DeployFunction = async (hre) => {
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;

	const { deployer } = await getNamedAccounts();

	await deploy('DNA', {
		from: deployer,
		log: true,
	});
};

deployFunction.tags = ['DNA'];

export default deployFunction;
