import { existsSync } from 'fs';
import { stat } from 'fs/promises';
import log from 'npmlog';
import path from 'path';
import { processBondoraWorkbook } from './bondora.utils';
import { calculateTotalProfit } from '../transaction/transaction.utils';
import { initExchangeRates } from '../exchange-rates/exhange-rate.utils';

export const bondoraAction = async (inputPath: string) =>
  new Promise<void>(async (resolve, reject) => {
    const resolvedPath = path.resolve(inputPath);

    log.enableProgress();

    if (!existsSync(resolvedPath)) {
      log.error('bondora', `ENOENT: no such file or directory, open ${resolvedPath}`);
      return reject();
    }

    await initExchangeRates();

    log.info('bondora', `Loading file / direcotry metadata for ${resolvedPath}`);

    const fileStats = await stat(inputPath);

    if (fileStats.isDirectory()) {
      log.error('bondora', `Expected path to point to a file but instead got a directory`);
      return reject();
    }

    log.info('bondora', 'Processing bondora workbook');
    const transactions = processBondoraWorkbook(resolvedPath);

    log.info('bondora', 'Calculating total profit');
    const totalProfit = await calculateTotalProfit(transactions);

    log.info('bondora', `Total profit is ${totalProfit.toFixed(2)} HUF`);

    log.disableProgress();

    // convert it to internal format
    // calculate taxes from it
    return Promise.resolve({
      totalProfit,
    });
  });
