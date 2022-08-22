'use strict';

const ExportData = require('../utils/exportData');

async function run() {
  const bizs = ['MjM5MjAyNDUyMA==', 'Mzk0MjE3NDE0Ng=='];
  const endAt = new Date();
  const startAt = new Date(endAt.getTime() - 1000 * 60 * 60 * 24 * 30);

  const exportData = new ExportData({ msgBiz: bizs });

  console.info('\n========== json ==========\n');
  console.info(await exportData.toJson(startAt, endAt));
  console.info('\n========== json ==========\n');

  console.info('\n========== csv ==========\n');
  console.info(await exportData.toCsv(startAt, endAt));
  console.info('\n========== csv ==========\n');

  console.info('\n========== StaJson ==========\n');
  console.info(await exportData.toStaJson(startAt, endAt));
  console.info('\n========== StaJson ==========\n');

  console.info('\n========== StaCsv ==========\n');
  console.info(await exportData.toStaCsv(startAt, endAt));
  console.info('\n========== StaCsv ==========\n');
}

run().then(() => {
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
