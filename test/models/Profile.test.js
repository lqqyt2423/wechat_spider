'use strict';

const assert = require('assert');
const models = require('../../models');

describe('Model Profile', function() {
  it('statics upsert', async function() {
    const rawProfile = { title: '勤天熹乐谷',
      desc: '勤天熹乐谷：南中国首席温泉度假综合体',
      msgBiz: 'MjM5MTI3OTgxOA==',
      province: 'Guangdong',
      city: 'Guangzhou' };

    const rawProfiles = [rawProfile, rawProfile];

    const profile = await models.Profile.upsert(rawProfile);
    const profiles = await models.Profile.upsert(rawProfiles);

    assert.equal(profiles.length, rawProfiles.length);
    assert.equal(profile.id, profiles[0].id);
  });
});
