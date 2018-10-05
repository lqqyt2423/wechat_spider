'use strict';

const assert = require('assert');
const models = require('../../models');

describe('Model Post', function() {
  it('statics upsert', async function() {
    const rawPosts = [ { title: '返程高峰杀到，地铁二号线增加列车疏运广州南站返程客流',
      link:
       'http://mp.weixin.qq.com/s?__biz=MzAwOTAwMzA5NQ==&mid=2710598126&idx=1&sn=c4cdc58d865883b4903af69bd686a4b6&chksm=bf0298d6887511c010386385db36ceb2dc817e88f41fc5b27b271c4d06ca6f4c954394e7ad31&scene=0#rd',
      publishAt: new Date('2018-10-05T08:05:39.000Z'),
      msgBiz: 'MzAwOTAwMzA5NQ==',
      msgMid: '2710598126',
      msgIdx: '1',
      cover:
       'http://mmbiz.qpic.cn/mmbiz_jpg/Ly1RT34mP0IibHoS6FpmiauPtgpWseAw7fR3yjVF4hOfMichuW4Wicbc7BdVxkf3ftybFt1WNVGfdDm8iapLFAL00Ng/640?wxtype=jpeg&wxfrom=0',
      digest: '不想堵在路上看车展的赶紧看过来' },
    { title: '超强台风“康妮”急速大拐弯，剩下的国庆假期还能好好玩耍？',
      link:
       'http://mp.weixin.qq.com/s?__biz=MzAwOTAwMzA5NQ==&mid=2710598126&idx=2&sn=373bd5a91cd1c596c879f38c1ad204cb&chksm=bf0298d6887511c0cab5efa29d494babda2ee06db456e7f1604a8f4095928cbb9bad4ba78ec0&scene=0#rd',
      publishAt: new Date('2018-10-05T08:05:39.000Z'),
      msgBiz: 'MzAwOTAwMzA5NQ==',
      msgMid: '2710598126',
      msgIdx: '2',
      cover:
       'http://mmbiz.qpic.cn/mmbiz_jpg/Ly1RT34mP0IibHoS6FpmiauPtgpWseAw7fz3FDhdPuJyaebsbjz86R0OG8MHf757RSFz8ISLS8Y3n2TefdaBD4MA/300?wxtype=jpeg&wxfrom=0',
      digest: '超强台风“康妮”急速大拐弯' } ];

    const posts = await models.Post.upsert(rawPosts);
    const post = await models.Post.upsert(rawPosts[0]);

    assert.equal(posts.length, rawPosts.length);
    assert.equal(posts[0].id, post.id);
  });
});
