import { Command } from 'commander';
import { textSync } from 'figlet';
import { bondoraAction } from './bondora/bondora.action';
import log from 'npmlog';
import { initExchangeRates, loadExchangeRates } from './exchange-rates/exhange-rate.utils';

const packageJson = require('../package.json');

console.log(textSync('taxhu'));

const program = new Command();

program
  .name('taxhu')
  .description('CLI tool for calculating personal income tax (szja) in Hungary based on interest and capital gains')
  .version(packageJson.version);

program
  .command('bondora')
  .description('Calculate szja from statements from Bondora')
  .argument('path', 'path to the input file')
  .action(async (inputFilePath: string) => {
    try {
      await bondoraAction(inputFilePath);
    } catch (error) {
      program.usage();
    }
  });

program.command('rates').action(async () => {
  log.enableProgress();
  log.info('Rates', 'Loading exhange rates for EUR, USD and GBP');
  loadExchangeRates().then((rates) => {
    log.info('Rates', `Exchange rates were loaded for ${rates.length} days`);

    log.info('Rates', `${rates[0].EUR.rate}`);
    log.disableProgress();
  });
});

program.parse();
