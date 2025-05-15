/**
 * 武道会记录工具 - 核心数据处理模块
 * 用于处理Excel数据和管理比赛记录
 */

// 导入必要库
import * as XLSX from 'xlsx';

/**
 * 从Excel文件中提取玩家数据
 * @param {ArrayBuffer} fileData - Excel文件的ArrayBuffer数据
 * @param {number} targetRow - 要读取的特定行号(如2099)
 * @returns {Array} 处理后的玩家数据数组
 */
function extractPlayerDataFromExcel(fileData, targetRow = 2099) {
  try {
    // 读取Excel文件
    const workbook = XLSX.read(new Uint8Array(fileData), { type: 'array' });
    
    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 将工作表转换为JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 如果目标行不存在,返回空数组
    if (jsonData.length < targetRow || !jsonData[targetRow - 1]) {
      console.error(`指定的行 ${targetRow} 不存在或为空`);
      return [];
    }
    
    // 从指定行获取数据
    const targetRowData = jsonData[targetRow - 1];
    
    // 解析表头(假设第一行是表头)
    const headers = jsonData[0];
    
    // 查找关键列的索引
    const nicknameIndex = headers.findIndex(h => 
      typeof h === 'string' && h.toLowerCase().includes('nickname'));
    const championshipsIndex = headers.findIndex(h => 
      typeof h === 'string' && h.toLowerCase().includes('championship'));
    const winsIndex = headers.findIndex(h => 
      typeof h === 'string' && h.toLowerCase().includes('wins'));
    const laoBaIndex = headers.findIndex(h => 
      typeof h === 'string' && h.toLowerCase().includes('lao ba'));
    
    // 如果找不到必要的列,则返回空数组
    if (nicknameIndex === -1) {
      console.error('找不到昵称列');
      return [];
    }
    
    // 构建玩家数据
    // 注意:将从Excel中读取的数据转换为适当的格式
    const playerData = [];
    
    // 处理单行数据的情况
    const player = {
      id: 1, // 自动生成ID
      name: targetRowData[nicknameIndex] || '未知玩家',
      championships: championshipsIndex !== -1 ? Number(targetRowData[championshipsIndex]) || 0 : 0,
      wins: winsIndex !== -1 ? Number(targetRowData[winsIndex]) || 0 : 0,
      laoBa: laoBaIndex !== -1 ? Number(targetRowData[laoBaIndex]) || 0 : 0,
      // 计算总分 (可以根据自定义规则调整)
      points: calculatePoints(
        championshipsIndex !== -1 ? Number(targetRowData[championshipsIndex]) || 0 : 0,
        winsIndex !== -1 ? Number(targetRowData[winsIndex]) || 0 : 0,
        laoBaIndex !== -1 ? Number(targetRowData[laoBaIndex]) || 0 : 0
      ),
      // 添加月份数据(示例)
      monthlyData: {
        '2025-04': {
          championships: championshipsIndex !== -1 ? Math.floor(Number(targetRowData[championshipsIndex]) * 0.3) || 0 : 0,
          wins: winsIndex !== -1 ? Math.floor(Number(targetRowData[winsIndex]) * 0.3) || 0 : 0,
          laoBa: laoBaIndex !== -1 ? Math.floor(Number(targetRowData[laoBaIndex]) * 0.3) || 0 : 0,
        },
        '2025-03': {
          championships: championshipsIndex !== -1 ? Math.floor(Number(targetRowData[championshipsIndex]) * 0.4) || 0 : 0,
          wins: winsIndex !== -1 ? Math.floor(Number(targetRowData[winsIndex]) * 0.4) || 0 : 0,
          laoBa: laoBaIndex !== -1 ? Math.floor(Number(targetRowData[laoBaIndex]) * 0.4) || 0 : 0,
        }
      }
    };
    
    playerData.push(player);
    
    return playerData;
  } catch (error) {
    console.error('处理Excel文件时出错:', error);
    return [];
  }
}

/**
 * 根据各项数据计算玩家总分
 * @param {number} championships - 冠军数
 * @param {number} wins - 胜场数
 * @param {number} laoBa - 老八数
 * @returns {number} 计算后的总分
 */
function calculatePoints(championships, wins, laoBa) {
  // 积分计算规则:
  // 冠军: 20分/个
  // 胜场: 10分/个
  // 老八: -5分/个
  return (championships * 20) + (wins * 10) - (laoBa * 5);
}

/**
 * 创建新的武道会记录
 * @param {Array} participants - 参与者数组,按排名顺序排列
 * @param {string} date - 比赛日期,默认为当前日期
 * @returns {Object} 新的武道会记录
 */
function createWudaohuiRecord(participants, date = new Date().toISOString().split('T')[0]) {
  // 验证参与者数据
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error('参与者数据无效');
  }
  
  // 创建比赛记录
  const record = {
    id: Date.now(), // 使用时间戳作为ID
    date: date,
    participants: participants.length,
    results: participants.map((player, index) => {
      const rank = index + 1;
      return {
        rank: rank,
        playerId: player.id,
        name: player.name,
        points: calculateMatchPoints(rank, participants.length)
      };
    })
  };
  
  return record;
}

/**
 * 根据排名计算单场比赛的积分
 * @param {number} rank - 玩家排名
 * @param {number} totalParticipants - 总参与人数
 * @returns {number} 比赛积分
 */
function calculateMatchPoints(rank, totalParticipants) {
  // 积分计算规则
  const pointsTable = {
    1: 20, // 冠军
    2: 15, // 亚军
    3: 12, // 季军
    4: 10,
    5: 8,
    6: 6,
    7: 4,
    8: 2
  };
  
  // 如果排名超出预设范围,按照最低分计算
  return pointsTable[rank] || 1;
}

/**
 * 根据新的武道会记录更新玩家数据
 * @param {Array} playerData - 当前的玩家数据
 * @param {Object} wudaohuiRecord - 武道会记录
 * @returns {Array} 更新后的玩家数据
 */
function updatePlayerStats(playerData, wudaohuiRecord) {
  // 创建玩家数据的副本
  const updatedPlayerData = [...playerData];
  
  // 处理比赛结果
  wudaohuiRecord.results.forEach(result => {
    // 查找玩家
    const playerIndex = updatedPlayerData.findIndex(p => p.id === result.playerId);
    
    if (playerIndex !== -1) {
      const player = updatedPlayerData[playerIndex];
      
      // 更新统计数据
      if (result.rank === 1) {
        player.championships += 1;
      }
      
      if (result.rank <= 3) {
        player.wins += 1;
      }
      
      if (result.rank === 8 || result.rank === wudaohuiRecord.participants) {
        player.laoBa += 1;
      }
      
      // 更新总分
      player.points += result.points;
      
      // 更新当月数据
      const date = new Date(wudaohuiRecord.date);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!player.monthlyData[yearMonth]) {
        player.monthlyData[yearMonth] = {
          championships: 0,
          wins: 0,
          laoBa: 0,
          points: 0
        };
      }
      
      if (result.rank === 1) {
        player.monthlyData[yearMonth].championships += 1;
      }
      
      if (result.rank <= 3) {
        player.monthlyData[yearMonth].wins += 1;
      }
      
      if (result.rank === 8 || result.rank === wudaohuiRecord.participants) {
        player.monthlyData[yearMonth].laoBa += 1;
      }
      
      player.monthlyData[yearMonth].points += result.points;
      
      // 更新玩家数据
      updatedPlayerData[playerIndex] = player;
    }
  });
  
  return updatedPlayerData;
}

/**
 * 根据指定类型获取排行榜数据
 * @param {Array} playerData - 玩家数据
 * @param {string} rankingType - 排行类型:'championships', 'wins', 'laoBa', 'points'
 * @param {string} timeRange - 时间范围:'all', 'month', 'week'
 * @returns {Array} 排序后的排行榜数据
 */
function getRankingList(playerData, rankingType = 'points', timeRange = 'all') {
  if (!Array.isArray(playerData) || playerData.length === 0) {
    return [];
  }
  
  // 创建数据副本
  let rankedPlayers = [...playerData];
  
  // 根据时间范围筛选数据
  if (timeRange !== 'all') {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    rankedPlayers = rankedPlayers.map(player => {
      const newPlayer = { ...player };
      
      if (timeRange === 'month') {
        // 过去一个月的数据
        const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        if (player.monthlyData && player.monthlyData[monthKey]) {
          newPlayer[rankingType] = player.monthlyData[monthKey][rankingType] || 0;
        } else {
          newPlayer[rankingType] = 0;
        }
      } else if (timeRange === 'week') {
        // 过去一周的数据(简化处理为当月数据的四分之一)
        const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        if (player.monthlyData && player.monthlyData[monthKey]) {
          newPlayer[rankingType] = Math.floor((player.monthlyData[monthKey][rankingType] || 0) / 4);
        } else {
          newPlayer[rankingType] = 0;
        }
      }
      
      return newPlayer;
    });
  }
  
  // 根据指定排名类型排序
  rankedPlayers.sort((a, b) => b[rankingType] - a[rankingType]);
  
  // 格式化排行榜数据
  return rankedPlayers.map((player, index) => ({
    rank: index + 1,
    id: player.id,
    name: player.name,
    avatar: player.avatar || '',
    score: player[rankingType]
  }));
}

/**
 * 导出函数和常量
 */
export {
  extractPlayerDataFromExcel,
  calculatePoints,
  createWudaohuiRecord,
  calculateMatchPoints,
  updatePlayerStats,
  getRankingList
};