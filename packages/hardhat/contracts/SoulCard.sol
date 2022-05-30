// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import '@openzeppelin/contracts/utils/Counters.sol';
import 'base64-sol/base64.sol';
import './HexStrings.sol';

contract SoulCard is Ownable, ERC721Enumerable {
  using Strings for uint256;
  using HexStrings for uint160;
  using Counters for Counters.Counter;
  Counters.Counter public _tokenIds;

  uint256 public waitingForApprove = 0;
  mapping(uint256 => address) public _pending_owners;
  mapping(uint256 => string) public _tokenURIs;

  constructor(string memory tokenName, string memory tokenSymbol) public ERC721(tokenName, tokenSymbol) {}

  function claim(string memory arLink) public returns (uint256) {
    _tokenIds.increment();
    uint256 tokenId = _tokenIds.current();

    _pending_owners[tokenId] = _msgSender();
    _tokenURIs[tokenId] = arLink;
    waitingForApprove++;
    return tokenId;
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), 'ERC721URIStorage: URI query for nonexistent token');

    return _tokenURIs[tokenId];
  }

  function approve_claim(uint256 tokenId) public{
    _safeMint(_pending_owners[tokenId], tokenId);

    _approve(_pending_owners[tokenId], tokenId);

    // Set the tokenURI to correct format
    string memory arLink = _tokenURIs[tokenId];
    string memory name = string(abi.encodePacked('SoulCard #', tokenId.toString()));
    string memory description = string(abi.encodePacked('SoulCard #', tokenId.toString()));

    string memory realURI = string(
      abi.encodePacked(
        'data:application/json;base64,',
        Base64.encode(
          bytes(
            abi.encodePacked(
              '{"name":"',
              name,
              '", "description":"',
              description,
              '", "external_url":"',
              arLink,
              '", "attributes": [], "owner":"',
              (uint160(ownerOf(tokenId))).toHexString(20),
              '", "image": "',
              arLink,
              '"}'
            )
          )
        )
      )
    );

   delete _pending_owners[tokenId];
    _tokenURIs[tokenId] = realURI;
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory _data 
  ) public virtual override {
    //solhint-disable-next-line max-line-length
    require(to == address(0x0), 'only Allow to transfer to zero addr');
    require(owner() == _msgSender() || _isApprovedOrOwner(_msgSender(), tokenId), 'ERC721: caller is not token owner nor approved');

    _burn(tokenId);
    if (bytes(_tokenURIs[tokenId]).length != 0) {
      delete _tokenURIs[tokenId];
    }
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public virtual override {
    //solhint-disable-next-line max-line-length
    require(to == address(0x0), 'only Allow to transfer to zero addr');
    require(owner() == _msgSender() || _isApprovedOrOwner(_msgSender(), tokenId), 'ERC721: caller is not token owner nor approved');

    _burn(tokenId);
    if (bytes(_tokenURIs[tokenId]).length != 0) {
      delete _tokenURIs[tokenId];
    }
  }
}