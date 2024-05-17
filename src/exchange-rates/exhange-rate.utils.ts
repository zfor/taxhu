import * as soap from 'soap';
import { XMLParser } from 'fast-xml-parser';
import log from 'npmlog';
import BigNumber from 'bignumber.js';
import { SupportedCurrency } from '../transaction/transaction.type';
import { add, format, isSameDay, parse, set, sub } from 'date-fns';

import { writeFileSync } from 'fs';

const prefix = 'exchange-rate';

let exchangeRates: readonly ExchangeRate[] = [];

export const initExchangeRates = async () => {
  log.info(prefix, `Initializing local exchange rate cache`);

  exchangeRates = await loadExchangeRates();

  writeFileSync('out.json', JSON.stringify(exchangeRates, undefined, 2), { encoding: 'utf-8' });

  log.info(prefix, `Exchange rates successfully cached`);
};

export const getRate = (date: Date, currency: SupportedCurrency): BigNumber => {
  if (currency === 'HUF') {
    return new BigNumber(1);
  }

  let exchangeRateDate: Date = set(add(date, { days: 1 }), { hours: 12 });
  let exchangeRate: ExchangeRate | undefined;

  do {
    exchangeRateDate = sub(exchangeRateDate, { days: 1 });
    exchangeRate = exchangeRates.find((rate) => isSameDay(rate.date, exchangeRateDate));
  } while (!exchangeRate);
  // } while (!exchangeRate && isAfter(sub(new Date(), { years: 1 }), exchangeRateDate));
  if (!exchangeRate) {
    log.error(
      prefix,
      `Failed to load exhange rate`,
      format(date, 'yyyy-MM-dd'),
      format(exchangeRateDate, 'yyyy-MM-dd')
    );
    throw new Error();
  }

  log.info(
    prefix,
    `Exchange rate found. Valid exchange rate for ${format(date, 'yyyy-MM-dd')} is ${new BigNumber(
      exchangeRate[currency].rate.toString().replace(',', '.')
    ).toFixed(2)} on ${format(exchangeRateDate, 'yyyy-MM-dd')}`
  );

  return new BigNumber(exchangeRate[currency].rate.toString().replace(',', '.'));
};

export const loadExchangeRates = () =>
  new Promise<readonly ExchangeRate[]>((resolve, reject) => {
    const parser = new XMLParser({
      attributeNamePrefix: '',
      textNodeName: 'rate',
      ignoreAttributes: false,
      allowBooleanAttributes: false,
      trimValues: true,
    });
    soap.createClient(
      'http://www.mnb.hu/arfolyamok.asmx?singleWsdl',
      { handleNilAsNull: true },
      async (error, client) => {
        client.GetExchangeRates(
          {
            currencyNames: 'EUR,USD,GBP',
            startDate: '2023-05-01',
          },
          async (error: unknown, response: any) => {
            let rates = parser.parse(response.GetExchangeRatesResult).MNBExchangeRates.Day;

            resolve(
              rates
                .filter((rate: any) => 'Rate' in rate)
                .map((rate: any) => {
                  if (!Array.isArray(rate.Rate)) {
                    rate.Rate = [rate.Rate];
                  }
                  return rate;
                })
                .map(
                  (rate: any): ExchangeRate => ({
                    date: set(parse(rate.date, 'yyyy-MM-dd', new Date()), { hours: 12 }),
                    EUR: rate.Rate.find((item: any) => item.curr === 'EUR'),
                    GBP: rate.Rate.find((item: any) => item.curr === 'GBP'),
                    USD: rate.Rate.find((item: any) => item.curr === 'USD'),
                  })
                )
            );
          }
        );
      }
    );
  });
