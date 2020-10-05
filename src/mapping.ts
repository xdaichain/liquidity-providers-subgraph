import { BigInt, Address, store, log } from '@graphprotocol/graph-ts';
import { LiquidityToken, Transfer } from '../generated/LiquidityToken/LiquidityToken';
import { AddressChecker } from '../generated/LiquidityToken/AddressChecker';
import { Distributed } from '../generated/Distribution/Distribution';
import { LiquidityProvider, CommonData, Round } from '../generated/schema';

let vampireAttackContracts: Array<string> = [
  '0x4e0dede6cafe84d8ba2a1036b7bbaef3be8876fa', // Lord Joker
  '0x12f5126a859ee926b598f3c76d25c05ae441686a', // MasterChef
  '0x3b49ddffca8110f9c635792c8a02592a0bc9db50', // SleepBedroom
];

let addressCheckerAddress = Address.fromString('0xe46ec14432033ede29343e9692a32c9adc314271');
let addressCheckerBlockNumber = BigInt.fromI32(10866458);

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
  liquidityProvider.save();
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
