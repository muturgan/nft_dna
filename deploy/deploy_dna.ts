import { DeployFunction } from 'hardhat-deploy/types';

const deployFunction: DeployFunction = async (hre) => {
	const parseEther = hre.ethers.utils.parseEther;

	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;

	const { deployer } = await getNamedAccounts();

	const args = [
		'0x760f17C973405E11559470B07a70e4f02db172E2', // owner
		'bafybeiajiadrxwjeh3vhcnziicqrovzcezdj7y6xjmg6o5lagourwggaem', // folder
		5000, // max count
		1655236800, // presale start date 2022-06-14T20:00:00 UTC
		1655928000, // sale start date 2022-06-22T20:00:00 UTC
		parseEther('0.5').toString(), // presale price
		parseEther('0.6').toString(), // sale price
	];

	await deploy('DNA', {
		from: deployer,
		args,
		log: true,
	});
};

deployFunction.tags = ['DNA'];

export default deployFunction;
