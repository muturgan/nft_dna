import { DeployFunction } from 'hardhat-deploy/types';

const deployFunction: DeployFunction = async (hre) => {
	const parseEther = hre.ethers.utils.parseEther;

	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;

	const { deployer } = await getNamedAccounts();

	const args = [
		'0x2A5e5cc1dA717B1F076Ce04E0c7A814320C0Dc6A', // owner
		'bafybeiceg22orqpbbda2ey4ua5letbh34os4sjalnqnjpdo5cekq275ffe', // folder
		5000, // max count
		1655236800, // presale start date 2022-06-14T20:00:00 UTC
		1655928000, // sale start date 2022-06-22T20:00:00 UTC
		parseEther('0.05').toString(), // presale price
		parseEther('0.06').toString(), // sale price
	];

	await deploy('DNA', {
		from: deployer,
		args,
		log: true,
	});
};

deployFunction.tags = ['DNA'];

export default deployFunction;
