'use strict';

const ContentHandler = require('../utils/contentHandler');

async function test(link) {
  const ch = new ContentHandler({ link });
  console.log('\n==========\n');
  console.log('getIdentifying:', await ch.getIdentifying());
  console.log('getDetail', await ch.getDetail());
  console.log('toHtml', await ch.toHtml());
  console.log('toText', await ch.toText());
}

(async () => {
  // normal
  await test('https://mp.weixin.qq.com/s/ERQ09QilTRQESaCLoafzYA');

  // image
  await test('https://mp.weixin.qq.com/s/eUkqq_u_cBpqE8Bl5Yxk0w');
})();
