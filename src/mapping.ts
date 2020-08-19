import { BigInt, Address, store, log } from '@graphprotocol/graph-ts';
import { Contract, Transfer } from '../generated/Contract/Contract';
import { LiquidityProvider, CommonData } from '../generated/schema';

function updateBalance(address: Address, value: BigInt, increase: boolean): void {
  if (address.toHexString() == '0x0000000000000000000000000000000000000000') return;
  let id = address.toHex();
  let liquidityProvider = LiquidityProvider.load(id);
  if (liquidityProvider == null) {
    liquidityProvider = new LiquidityProvider(id);
    liquidityProvider.address = address;
    liquidityProvider.balance = BigInt.fromI32(0);
  }
  liquidityProvider.balance = increase ? liquidityProvider.balance.plus(value) : liquidityProvider.balance.minus(value);
  if (liquidityProvider.balance.isZero()) {
    store.remove('LiquidityProvider', id);
  } else {
    liquidityProvider.save();
  }
}

function updateTotalSupply(contract: Contract): void {
  let commonData = CommonData.load('common');
  if (commonData == null) {
    commonData = new CommonData('common');
    commonData.totalSupply = BigInt.fromI32(0);
  }
  commonData.totalSupply = contract.totalSupply();
  commonData.save();
}

export function handleTransfer(event: Transfer): void {
  let contract = Contract.bind(event.address);
  updateBalance(event.params.from, event.params.value, false);
  updateBalance(event.params.to, event.params.value, true);
  updateTotalSupply(contract);
}
