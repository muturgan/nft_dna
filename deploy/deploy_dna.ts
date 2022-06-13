import { DeployFunction } from 'hardhat-deploy/types';

const deployFunction: DeployFunction = async (hre) => {
	const parseEther = hre.ethers.utils.parseEther;

	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;

	const { deployer } = await getNamedAccounts();

	const args = [
		'0x760f17C973405E11559470B07a70e4f02db172E2', // owner
		// 'QmTTS6eSoXdPceaXSYqgFgH2YU6Fd6RzAXMPJLnEK1QNpW', // folder my
		'QmNNTm5UyZuknLvEvSUHMYeuSt5Q3CUv43CuUg6T8wKC26', // folder kuznetsov
		100, // max count
		1655078400, // presale start date 2022-06-14T20:00:00 UTC
		1655139600, // sale start date 2022-06-22T20:00:00 UTC
		parseEther('0.0005').toString(), // presale price
		parseEther('0.0006').toString(), // sale price
	];

	await deploy('DNA', {
		from: deployer,
		args,
		log: true,
	});
};

deployFunction.tags = ['DNA'];

export default deployFunction;
