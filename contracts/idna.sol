// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

enum SaleStatus {NotStarted, PreSale, Sale, Finished}

interface IDNA is IERC721, IERC721Metadata, IERC721Enumerable {
	function mint() external payable;
	function setDefaultRoyalty(uint96 feeNumerator) external;
	function setTokenRoyalty(uint tokenId, uint96 feeNumerator) external;
	function withdaraw() external;
	function saleStatus() external view returns(SaleStatus);
	function currentPrice() external view returns(uint);
	function PRESALE_START_DATE() external view returns(uint);
	function SALE_START_DATE() external view returns(uint);
	function PRESALE_PRICE() external view returns(uint);
	function SALE_PRICE() external view returns(uint);
}
