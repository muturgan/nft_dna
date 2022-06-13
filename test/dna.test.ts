import { ethers, getNamedAccounts, network } from 'hardhat';
import { assert, expect } from './chai';
import { DNA, DNA__factory } from '../typechain-types';

const parseEther = ethers.utils.parseEther;
const presalePrice = parseEther('0.5');
const salePrice = parseEther('0.6');
const folder = 'folder_hash';
const maxCount = 6;
const presaleStartDate = ((Date.now() + (1000 * 60 * 3)) / 1000).toFixed();
const saleStartDate = ((Date.now() + (1000 * 60 * 60 * 24 * 3)) / 1000).toFixed();

const enum SaleStatus {NotStarted, PreSale, Sale, Finished}

let dna: DNA;

describe('DNA', async () => {

	before(async () => {
		const { dnaOwner } = await getNamedAccounts();
		const [deployerSigner] = await ethers.getSigners();
		const dnaFactory = await ethers.getContractFactory('DNA', deployerSigner) as DNA__factory;
		dna = await dnaFactory.deploy(
			dnaOwner,
			folder,
			maxCount,
			presaleStartDate,
			saleStartDate,
			presalePrice.toString(),
			salePrice.toString(),
		);
		await dna.deployed();
	});

	it(`the sale isn't started`, async () => {
		const [, , user2Signer] = await ethers.getSigners();
		const user2Connection = dna.connect(user2Signer);

		const status = await user2Connection.saleStatus();
		assert.strictEqual(status, SaleStatus.NotStarted);

		await expect(user2Connection.mint())
			.to.be.revertedWith(`the sale isn't started`);
	});

	it(`should start a presale`, async () => {
		const [, , user2Signer, user3Signer] = await ethers.getSigners();

		await network.provider.send(
			'evm_increaseTime',
			[1 * 60 * 60 * 24 * 2], // 2 days
		);

		// just to mine a new block
		const tx = await user2Signer.sendTransaction({
			from: user2Signer.address,
			to: user3Signer.address,
			value: parseEther('0.0001'),
		});
		await tx.wait();

		const status = await dna.saleStatus();
		assert.strictEqual(status, SaleStatus.PreSale);

		const currentPrice = await dna.currentPrice();
		assert.strictEqual(currentPrice, presalePrice);
	});

	it(`mint a one token on presale`, async () => {
		const [, , user2Signer] = await ethers.getSigners();
		const user2Connection = dna.connect(user2Signer);

		const tx = await user2Connection.mint({value: presalePrice});
		await tx.wait();

		const totalSupply = await dna.totalSupply();
		assert.strictEqual(Number(totalSupply), 1);

		const nftBalance = await dna.balanceOf(user2Signer.address);
		assert.strictEqual(Number(nftBalance), 1);
	});

	it(`mint within a receive method`, async () => {
		const [, , , user3Signer] = await ethers.getSigners();

		const tx = await user3Signer.sendTransaction({
			from: user3Signer.address,
			to: dna.address,
			value: presalePrice,
		});
		await tx.wait();

		const totalSupply = await dna.totalSupply();
		assert.strictEqual(Number(totalSupply), 2);

		const nftBalance = await dna.balanceOf(user3Signer.address);
		assert.strictEqual(Number(nftBalance), 1);
	});

	it(`mint two tokens on presale`, async () => {
		const [, , , , user4Signer] = await ethers.getSigners();
		const user4Connection = dna.connect(user4Signer);

		const tx = await user4Connection.mint({value: presalePrice.mul(2)});
		await tx.wait();

		const nftBalance = await dna.balanceOf(user4Signer.address);
		assert.strictEqual(Number(nftBalance), 2);

		const totalSupply = await dna.totalSupply();
		assert.strictEqual(Number(totalSupply), 4);
	});

	it(`should start a sale`, async () => {
		const [, , user2Signer, user3Signer] = await ethers.getSigners();

		await network.provider.send(
			'evm_increaseTime',
			[1 * 60 * 60 * 24 * 10], // 10 days
		);

		// just to mine a new block
		const tx = await user2Signer.sendTransaction({
			from: user2Signer.address,
			to: user3Signer.address,
			value: parseEther('0.0001'),
		});
		await tx.wait();

		const status = await dna.saleStatus();
		assert.strictEqual(status, SaleStatus.Sale);

		const currentPrice = await dna.currentPrice();
		assert.strictEqual(currentPrice, salePrice);
	});

	it(`mint only one token if not enougth of money`, async () => {
		const [, , , , , user5Signer] = await ethers.getSigners();
		const user5Connection = dna.connect(user5Signer);

		const tx = await user5Connection.mint({value: presalePrice.mul(2)});
		await tx.wait();

		const nftBalance = await dna.balanceOf(user5Signer.address);
		assert.strictEqual(Number(nftBalance), 1);

		const totalSupply = await dna.totalSupply();
		assert.strictEqual(Number(totalSupply), 5);
	});

	it(`mint only one token if it is a last token (and close a sale)`, async () => {
		const [, , , , , , user6Signer] = await ethers.getSigners();
		const user6Connection = dna.connect(user6Signer);

		const tx = await user6Connection.mint({value: salePrice.mul(2)});
		await tx.wait();

		const nftBalance = await dna.balanceOf(user6Signer.address);
		assert.strictEqual(Number(nftBalance), 1);

		const totalSupply = await dna.totalSupply();
		assert.strictEqual(Number(totalSupply), 6);

		const status = await user6Connection.saleStatus();
		assert.strictEqual(status, SaleStatus.Finished);
	});

	it(`the sale is over`, async () => {
		const [, , , , user4Signer] = await ethers.getSigners();
		const user4Connection = dna.connect(user4Signer);

		await expect(user4Connection.mint({value: salePrice}))
			.to.be.revertedWith(`the sale is over`);
	});

	it(`should prevent a withdraw`, async () => {
		const [, , , , user4Signer] = await ethers.getSigners();
		const user4Connection = dna.connect(user4Signer);

		await expect(user4Connection.withdaraw())
			.to.be.revertedWith(`not an owner`);
	});

	it(`should withdraw correctly`, async () => {
		const provider = ethers.provider;

		const [, ownerSigner] = await ethers.getSigners();
		const ownerConnection = dna.connect(ownerSigner);

		const ownerBalanceBefore = await provider.getBalance(ownerSigner.address);
		const contractBalance = await provider.getBalance(dna.address);

		const tx = await ownerConnection.withdaraw();
		const receipt = await tx.wait();
		const gasUsed = receipt.gasUsed;
		const gasPrice = receipt.effectiveGasPrice;

		const ownerBalanceAfter = await provider.getBalance(ownerSigner.address);
		assert.strictEqual(
			ownerBalanceAfter.sub(ownerBalanceBefore),
			contractBalance.sub(gasUsed.mul(gasPrice)),
		);
	});

	it(`withdraw within a recieve method`, async () => {
		const provider = ethers.provider;

		const [, ownerSigner, anotherSigner] = await ethers.getSigners();

		const testValue = parseEther('0.000007');

		// just a transfer to withdraw it in the future
		await anotherSigner.sendTransaction({
			from: anotherSigner.address,
			to: dna.address,
			value: testValue,
		}).then((t) => t.wait());

		const ownerBalanceBefore = await provider.getBalance(ownerSigner.address);

		const tx = await ownerSigner.sendTransaction({
			from: ownerSigner.address,
			to: dna.address,
			value: testValue,
		});
		const receipt = await tx.wait();
		const gasUsed = receipt.gasUsed;
		const gasPrice = receipt.effectiveGasPrice;

		const ownerBalanceAfter = await provider.getBalance(ownerSigner.address);
		assert.strictEqual(
			ownerBalanceAfter.sub(ownerBalanceBefore),
			testValue.sub(gasUsed.mul(gasPrice)),
		);
	});

	it(`royalty was inited with a default value`, async () => {
		const p2pSalePrice = 1000;
		const [, ownerSigner] = await ethers.getSigners();
		const [royaltyReceiver, royaltyAmount] = await dna.royaltyInfo(1, p2pSalePrice);

		assert.strictEqual(royaltyReceiver, ownerSigner.address);
		assert.strictEqual(Number(royaltyAmount), p2pSalePrice / 10); // default 10%
	});

	it(`should prevent to set a token royalty`, async () => {
		const [, , , , user4Signer] = await ethers.getSigners();
		const user4Connection = dna.connect(user4Signer);

		await expect(user4Connection.setTokenRoyalty(1, 2222))
			.to.be.revertedWith(`not an owner`);
	});

	it(`should prevent to set default royalty`, async () => {
		const [, , , , user4Signer] = await ethers.getSigners();
		const user4Connection = dna.connect(user4Signer);

		await expect(user4Connection.setDefaultRoyalty(2222))
			.to.be.revertedWith(`not an owner`);
	});

	it(`should update royalty`, async () => {
		const p2pSalePrice = 1000;
		const [, ownerSigner] = await ethers.getSigners();
		const ownerConnection = dna.connect(ownerSigner);

		await ownerConnection.setDefaultRoyalty(5000); // 50%
		await ownerConnection.setTokenRoyalty(2, 500); // 5%

		const [, defaultRoyaltyAmount] = await dna.royaltyInfo(1, p2pSalePrice);
		assert.strictEqual(Number(defaultRoyaltyAmount), p2pSalePrice / 2);

		const [, token2RoyaltyAmount] = await dna.royaltyInfo(2, p2pSalePrice);
		assert.strictEqual(Number(token2RoyaltyAmount), p2pSalePrice / 20);
	});

	it(`should prevent to set a royalty for nonexistent token`, async () => {
		const [, ownerSigner] = await ethers.getSigners();
		const ownerConnection = dna.connect(ownerSigner);

		await expect(ownerConnection.setTokenRoyalty(100500, 500))
			.to.be.revertedWith(`nonexistent token`);
	});
});
