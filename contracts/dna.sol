// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract DNA is
	ERC721,
	ERC721Enumerable,
	ERC721URIStorage,
	ERC2981
{
	enum SaleStatus {NotStarted, PreSale, Sale, Finished}

	uint private constant MAX_NFT_COUNT = 5000;
	uint public constant PRESALE_START_DATE = 1655215200; // 2022-06-14T20:00:00 UTC
	uint public constant SALE_START_DATE    = 1655906400; // 2022-06-22T20:00:00 UTC
	uint public constant PRESALE_PRICE = 0.5 ether;
	uint public constant SALE_PRICE    = 0.6 ether;
	string private FOLDER;

	address public immutable owner;
	uint private tokenIdCounter;

	modifier onlyOwner() {
		require(owner == msg.sender, "caller is not the owner");
		_;
	}


	constructor(address _owner, string memory _folder) ERC721("Norman's Duel: Apes", "NDA") {
		owner = _owner;
		FOLDER = _folder;

		_setDefaultRoyalty(_owner, 1000);
	}

	function _baseURI() internal pure override returns(string memory) {
		return "https://ipfs.io/ipfs/";
	}

	function mint() public payable {
		uint timestamp = block.timestamp;
		require(timestamp >= PRESALE_START_DATE, "the sale isn't started");

		address sender = msg.sender;
		uint price = timestamp >= SALE_START_DATE ? SALE_PRICE : PRESALE_PRICE;

		uint value = msg.value;
		if (value >= price) {
			mintItem(sender);
		}
		if (value >= price * 2) {
			if (tokenIdCounter < MAX_NFT_COUNT) {
				mintItem(sender);
			}
			else {
				payable(sender).transfer(price);
			}
		}
	}

	function mintItem(address to) private {
		require(tokenIdCounter < MAX_NFT_COUNT, "the sale is over");
		unchecked {
			tokenIdCounter += 1;
		}
		uint256 tokenId = tokenIdCounter;
		_safeMint(to, tokenId);
		string memory uri = string.concat(FOLDER, "/", Strings.toString(tokenIdCounter), ".json");
		_setTokenURI(tokenId, uri);
	}

	function setDefaultRoyalty(uint96 feeNumerator) external onlyOwner {
		_setDefaultRoyalty(owner, feeNumerator);
	}

	function setTokenRoyalty(uint tokenId, uint96 feeNumerator) external onlyOwner {
		require(_exists(tokenId), "nonexistent token");
		_setTokenRoyalty(tokenId, owner, feeNumerator);
	}

	function withdaraw() external onlyOwner {
		payable(owner).transfer(address(this).balance);
	}

	function saleStatus() external view returns(SaleStatus) {
		if (block.timestamp < PRESALE_START_DATE) {
			return SaleStatus.NotStarted;
		}
		if (totalSupply() == MAX_NFT_COUNT) {
			return SaleStatus.Finished;
		}
		if (block.timestamp < SALE_START_DATE) {
			return SaleStatus.Sale;
		}
		return SaleStatus.PreSale;
	}


	receive() external payable {}

	fallback() external payable {}


	// <<<<< The following functions are overrides required by Solidity.
	function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
		super._beforeTokenTransfer(from, to, tokenId);
	}

	function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
		super._burn(tokenId);
	}

	function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns(string memory) {
		return super.tokenURI(tokenId);
	}

	function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC2981) returns(bool) {
		return super.supportsInterface(interfaceId);
	}
	// >>>> These functions are overrides required by Solidity.
}
