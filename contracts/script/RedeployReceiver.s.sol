// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";

import {IngotIndex} from "../src/IngotIndex.sol";
import {IngotIndexReceiver} from "../src/IngotIndexReceiver.sol";

/// @notice Replaces the deployed IngotIndexReceiver with the current one, leaving every other
///         contract, and the index's history, where it is.
/// @dev The first receiver did not answer ERC165, so Chainlink's forwarder skipped it and no CRE
///      report could ever arrive. This deploys the fixed receiver, makes it an index publisher,
///      and removes the old one. The forwarder and workflow are left unset: the receiver refuses
///      every report until they are pinned.
///
///      Reads the index and the old receiver from deployments/10143.json and prints the new
///      address; recording it in the repository is a separate commit.
contract RedeployReceiver is Script {
    function run() external returns (IngotIndexReceiver receiver) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        string memory deployment = vm.readFile("deployments/10143.json");
        IngotIndex index = IngotIndex(vm.parseJsonAddress(deployment, ".index"));
        address old = vm.parseJsonAddress(deployment, ".indexReceiver");

        vm.startBroadcast(deployerKey);
        receiver = new IngotIndexReceiver(index, bytes32("ingot-h100-index-v1"), deployer);
        index.setPublisher(address(receiver), true);
        index.setPublisher(old, false);
        vm.stopBroadcast();

        require(receiver.supportsInterface(0x805f2132), "new receiver must answer IReceiver");
        require(index.isPublisher(address(receiver)) && !index.isPublisher(old), "publishers not swapped");
        console.log("old receiver    ", old);
        console.log("new receiver    ", address(receiver));
    }
}
