// mock/api/genPersonalInfo.js

const { formatTime, getLocalUrl } = require('../../utils/util.js');

module.exports = {
  path: '/api/genPersonalInfo',

  // 异步 data 方法，确保云文件下载与复制完成
  data: async function() {
    // 包内静态资源
    const avatarUrl = '/static/avatar1.png';

    // 云存储文件 ID
    const cloudFileID = 'cloud://cloud1-3gwil7q954ab85d2.636c-cloud1-3gwil7q954ab85d2-1358898580/static/img_td.png';

    // 下载并缓存两张图片
    const photo1Url = await getLocalUrl(cloudFileID, 'uploaded1.png');
    const photo2Url = await getLocalUrl(cloudFileID, 'uploaded2.png');

    return {
      code: 200,
      message: 'success',
      data: {
        image:   avatarUrl,
        name:    '小小轩',
        star:    '天枰座',
        gender:  0,
        birth:   '1994-09-27',
        address: ['440000', '440300'],
        brief:   '在你身边，为你设计',
        photos: [
          { url: photo1Url, name: 'uploaded1.png', type: 'image' },
          { url: photo2Url, name: 'uploaded2.png', type: 'image' },
        ],
      },
    };
  },
};
