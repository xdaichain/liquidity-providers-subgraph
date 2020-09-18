import { BigInt, Address, store, log } from '@graphprotocol/graph-ts';
import { LiquidityToken, Transfer } from '../generated/LiquidityToken/LiquidityToken';
import { AddressChecker } from '../generated/LiquidityToken/AddressChecker';
import { Distributed } from '../generated/Distribution/Distribution';
import { LiquidityProvider, CommonData, Round } from '../generated/schema';

let vampireAttackContracts: Array<string> = [
  '0x0ec1f1573f3a2db0ad396c843e6a079e2a53e557', // Sake
];

const addressCheckerAddress = Address.fromString('0xe46ec14432033ede29343e9692a32c9adc314271');
const addressCheckerBlockNumber = BigInt.fromI32(10866458);

function updateBalance(address: Address, value: BigInt, increase: boolean, blockNumber: BigInt): void {
  if (address.toHexString() == '0x0000000000000000000000000000000000000000') return;
  let id = address.toHex();
  let liquidityProvider = LiquidityProvider.load(id);
  if (liquidityProvider == null) {
    liquidityProvider = new LiquidityProvider(id);
    liquidityProvider.address = address;
    liquidityProvider.balance = BigInt.fromI32(0);
    let isContract = false;
    if (blockNumber.gt(addressCheckerBlockNumber)) {
      let addressCheckerInstance = AddressChecker.bind(addressCheckerAddress);
      isContract = addressCheckerInstance.isContract(address);
    }
    liquidityProvider.isContract = isContract;
  }
  liquidityProvider.balance = increase ? liquidityProvider.balance.plus(value) : liquidityProvider.balance.minus(value);
  if (liquidityProvider.balance.isZero()) {
    store.remove('LiquidityProvider', id);
  } else {
    liquidityProvider.save();
  }
}

function updateTotalSupply(contract: LiquidityToken): void {
  let commonData = CommonData.load('common');
  if (commonData == null) {
    commonData = new CommonData('common');
    commonData.totalSupply = BigInt.fromI32(0);
  }
  commonData.totalSupply = contract.totalSupply();
  commonData.save();
}

export function handleTransfer(event: Transfer): void {
  let contract = LiquidityToken.bind(event.address);
  if (
    !vampireAttackContracts.includes(event.params.from.toHexString()) &&
    !vampireAttackContracts.includes(event.params.to.toHexString())
  ) {
    updateBalance(event.params.from, event.params.value, false, event.block.number);
    updateBalance(event.params.to, event.params.value, true, event.block.number);
  }
  updateTotalSupply(contract);
}

export function handleDistributed(event: Distributed): void {
  let id = event.transaction.hash.toHex();
  let round = new Round(id);
  round.pool = event.params.pool;
  round.snapshotBlockNumber = event.params.snapshotBlockNumber;
  round.numberOfRewards = event.params.numberOfRewards;
  round.total = event.params.total;
  round.fee = event.params.fee;
  round.save();
}
