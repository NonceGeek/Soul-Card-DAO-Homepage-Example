import { List } from "antd";
import { useContractReader } from "eth-hooks";
import { useEffect, useState } from "react";
import { Nft, UnApprovedNfts } from "../components";

function Home({ readContracts, writeContracts, tx }) {
  const totalSupply = useContractReader(readContracts, "SoulCard", "totalSupply");
  const waitingApproveNum = useContractReader(readContracts, "SoulCard", "waitingForApprove");
  const [nfts, setNfts] = useState([]);
  const [unApprovedNfts, setUnApprovedNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const blockExplorer = "https://moonbeam.moonscan.io/";

  const getNft = async (mintedNfts, i) => {
    try {
      let id = await readContracts.SoulCard.tokenByIndex(i);
      let owner = await readContracts.SoulCard.ownerOf(id);
      let uri = await readContracts.SoulCard.tokenURI(id);
      // console.log(uri)//, atob(uri));
      let nft = JSON.parse(atob(uri.split(",")[1]));
      nft.owner = owner;
      nft.tokenId = id;
      // console.log(nft);
      mintedNfts.push(nft);
    } catch (e) {
      console.log(e);
    }
  };

  const getUnApprovedNfts = async (unApprovedNfts, i) => {
    try {
      let owner = await readContracts.SoulCard._pending_owners(i);
      let tokenURI = await readContracts.SoulCard._tokenURIs(i);
      // let id = await readContracts.SoulCard.tokenByIndex(i);
      // let owner = await readContracts.SoulCard.ownerOf(id);
      // let uri = await readContracts.SoulCard.tokenURI(id);
      // // console.log(uri)//, atob(uri));
      // let nft = JSON.parse(atob(uri.split(",")[1]));
      // nft.owner = owner;
      // nft.tokenId = id;
      // console.log(nft);
      let nft = {}
      nft.owner = owner;
      nft.tokenId = i;
      nft.tokenURI = tokenURI;
      unApprovedNfts.push(nft);
    } catch (e) {
      console.log(e);
    }
  };

  // TODO: add a cache to store the chain's nfts, no need to query every refresh
  // TODO: show 3 nfts each row
  const getAllMintedNfts = async () => {
    setLoading(true);
    let tot = totalSupply.toNumber();
    var tasks = [];
    var mintedNfts = [];
    for (let i = 0; i < tot; i++) {
      tasks.push(getNft(mintedNfts, i));
    }
    await Promise.all(tasks);
    setNfts(mintedNfts);
    setLoading(false);
  };

  const getAllApproveNeededNFT = async () => {
    setLoading(true);
    let tot = waitingApproveNum.toNumber();
    var tasks = [];
    var unApprovedNfts = [];
    for (let i = 1; i <= tot; i++) {
      tasks.push(getUnApprovedNfts(unApprovedNfts, i));
    }
    await Promise.all(tasks);
    setUnApprovedNfts(unApprovedNfts);
    setLoading(false);
  };

  useEffect(() => {
    if (!totalSupply || nfts.length > 0) return;
    getAllMintedNfts();
  }, [totalSupply]);

  useEffect(() => {
    if (!waitingApproveNum || unApprovedNfts.length > 0) return;
    getAllApproveNeededNFT();
  }, [waitingApproveNum]);

  return (
    <div>
      <div>
        Nft Waiting for Approval: {waitingApproveNum?.toString()}
        <List
          itemLayout="horizontal"
          dataSource={unApprovedNfts}
          loading={loading}
          renderItem={item => (
            <UnApprovedNfts
              nft={item}
              blockExplorer={blockExplorer}
              readContracts={readContracts}
              writeContracts={writeContracts}
              tx={tx}
            />
          )}
        />
        <hr></hr>
        Nft Minted: {totalSupply?.toString()}
        <List
          itemLayout="horizontal"
          dataSource={nfts}
          loading={loading}
          renderItem={item => (
            <Nft
              nft={item}
              blockExplorer={blockExplorer}
              readContracts={readContracts}
              writeContracts={writeContracts}
              tx={tx}
            />
          )}
        />
      </div>
    </div>
  );
}

export default Home;
