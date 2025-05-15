// utils/util.js

/**
 * 格式化数字，个位数前补 0
 */
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

/**
 * 格式化时间，输出 "YYYY/MM/DD hh:mm:ss"
 */
const formatTime = date => {
  const year   = date.getFullYear();
  const month  = date.getMonth() + 1;
  const day    = date.getDate();
  const hour   = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second]
    .map(formatNumber)
    .join(':')}`;
};

/**
 * 复制/下载文件到本地用户目录并返回本地绝对路径
 * @param {string} path 云存储 fileID（以 cloud:// 开头）或包内/本地路径
 * @param {string} name 保存在用户目录下的文件名
 * @returns {Promise<string>} 本地绝对路径
 */
const getLocalUrl = (path, name) => {
  return new Promise((resolve, reject) => {
    // 如果不是云存储路径，直接返回原始路径
    if (!path.startsWith('cloud://')) {
      return resolve(path);
    }
    // 云能力下载
    wx.cloud
      .downloadFile({ fileID: path })
      .then(res => {
        const fs = wx.getFileSystemManager();
        const target = `${wx.env.USER_DATA_PATH}/${name}`;
        fs.copyFile({
          srcPath: res.tempFilePath,
          destPath: target,
          success: () => resolve(target),
          fail: err => {
            console.error('fs.copyFile 失败', err);
            reject(err);
          },
        });
      })
      .catch(err => {
        console.error('wx.cloud.downloadFile 失败', err);
        reject(err);
      });
  });
};

module.exports = {
  formatTime,
  getLocalUrl,
};
