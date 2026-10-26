// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @notice Chainlink CRE's receiver interface, as the Keystone forwarder calls it.
/// @dev Matches `IReceiver` in smartcontractkit/chainlink-evm (contracts/cre/src/v1/interfaces). The
///      forwarder checks `supportsInterface(type(IReceiver).interfaceId)` before it calls
///      `onReport`, and skips a receiver that does not answer yes: the transaction still succeeds,
///      and nothing is delivered.
interface IReceiver is IERC165 {
    function onReport(bytes calldata metadata, bytes calldata report) external;
}
