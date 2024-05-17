import BigNumber from 'bignumber.js';
import { Transaction } from './transaction.type';
import { getRate } from '../exchange-rates/exhange-rate.utils';
import log from 'npmlog';

export const calculateTotalProfit = async (transactions: readonly Transaction[]): Promise<BigNumber> =>
  new Promise(async (resolve) => {
    let total = new BigNumber(0);

    for (const transaction of transactions) {
      //await sleep(20);

      const profit = new BigNumber(transaction.profit);

      if (transaction.currency === 'HUF') {
        total = total.plus(transaction.profit);
        continue;
      }

      const rate = getRate(transaction.date, transaction.currency);

      total = total.plus(profit.times(rate));

      log.info(
        'transaction',
        `Profit (transaction / cumulative): ${rate.times(transaction.profit).toString()} HUF / ${total.toString()} HUF`
      );
    }

    resolve(total);
  });

const sleep = async (timeout = 0) => new Promise<void>((resolve) => setTimeout(resolve, timeout));
