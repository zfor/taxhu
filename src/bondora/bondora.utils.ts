import { readFile, utils } from 'xlsx';
import { parse, format, set } from 'date-fns';
import { Transaction } from '../transaction/transaction.type';

export const processBondoraWorkbook = (path: string): readonly Transaction[] => {
  const workbook = readFile(path);

  const dataSheet = workbook.Sheets['Data'];

  const rows = utils
    .sheet_to_json(dataSheet, {
      blankrows: false,
      range: 8,
      header: ['date', 'type', 'in', 'out', 'balance'],
    })
    .filter((row: any) => row.type === 'Go & Grow returns');

  const transactions: readonly Transaction[] = rows.map((row: any) => ({
    currency: 'EUR',
    date: set(parse(row.date, 'M/dd/yyyy', new Date()), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }),
    profit: row.in.toString(),
    type: 'interest',
  }));

  return transactions;
};
