// pages/winrate/index.js - updated to better handle Excel file data
import Toast from 'tdesign-miniprogram/toast/index';
const XLSX = require('../../utils/xlsx.js');

Page({
  data: {
    hasData: false,
    loading: false,
    heroList: [],
    searchValue: '',
    filteredHeroList: [],
    excelFileName: ''
  },

  onLoad() {
    this.checkExcelData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({
        value: 'winrate'
      });
    }
    // Refresh the data when the page is shown
    this.checkExcelData();
  },

  checkExcelData() {
    const path = wx.getStorageSync('heroExcelPath');
    const name = wx.getStorageSync('heroExcelName');
    if (path) {
      this.setData({ excelFileName: name || 'information.xlsx' });
      this.loadExcelFile(path);
    } else {
      this.setData({ hasData: false });
    }
  },

  loadExcelFile(filePath) {
    this.setData({ loading: true });
    wx.getFileSystemManager().readFile({
      filePath,
      success: res => {
        try {
          const data = new Uint8Array(res.data);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          let jsonData = XLSX.utils.sheet_to_json(sheet);
          
          console.log('Raw Excel data:', jsonData.slice(0, 3)); // Log first few rows
          
          // Try to extract hero data based on different possible column structures
          const heroes = [];
          jsonData.forEach(row => {
            // Find the hero name column (could be "D", "英雄名称", "英雄" etc.)
            let heroName = '';
            let wins = 0;
            let losses = 0;
            let draws = 0;
            
            // Try to identify columns by key
            if (row['D'] !== undefined) heroName = row['D'];
            else if (row['英雄名称'] !== undefined) heroName = row['英雄名称'];
            else if (row['英雄'] !== undefined) heroName = row['英雄'];
            
            // Try to identify win/loss/draw data
            if (row['I'] !== undefined) wins = Number(row['I']);
            else if (row['胜场'] !== undefined) wins = Number(row['胜场']);
            else if (row['胜利'] !== undefined) wins = Number(row['胜利']);
            
            if (row['J'] !== undefined) losses = Number(row['J']);
            else if (row['失败'] !== undefined) losses = Number(row['失败']);
            
            if (row['K'] !== undefined) draws = Number(row['K']);
            else if (row['平局'] !== undefined) draws = Number(row['平局']);
            
            // If all else fails, try to get data by numeric indices for specific columns
            // Excel columns: A=0, B=1, C=2, D=3, I=8, J=9, K=10
            const keys = Object.keys(row);
            if (!heroName && keys.length > 3) heroName = String(row[keys[3]]);
            if (!wins && keys.length > 8) wins = Number(row[keys[8]]) || 0;
            if (!losses && keys.length > 9) losses = Number(row[keys[9]]) || 0;
            if (!draws && keys.length > 10) draws = Number(row[keys[10]]) || 0;
            
            // Only add valid entries
            if (heroName) {
              const totalGames = wins + losses + draws;
              const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(2) : '0.00';
              
              heroes.push({
                name: heroName,
                wins: wins,
                losses: losses,
                draws: draws,
                totalGames: totalGames,
                winRate: winRate
              });
            }
          });
          
          console.log('Processed hero data:', heroes.slice(0, 3)); // Log first few processed heroes
          
          // Sort by win rate (highest first)
          heroes.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
          
          if (heroes.length > 0) {
            this.setData({
              heroList: heroes,
              filteredHeroList: heroes,
              hasData: true,
              loading: false
            });
            
            Toast({ context: this, message: '已加载英雄数据', theme: 'success' });
          } else {
            this.setData({ 
              loading: false,
              hasData: false
            });
            Toast({ context: this, message: '未找到有效的英雄数据', theme: 'error' });
          }
        } catch (e) {
          console.error('Parse error:', e);
          Toast({ context: this, message: '解析文件失败，请检查格式', theme: 'error' });
          this.setData({ loading: false });
        }
      },
      fail: err => {
        console.error('Read file error:', err);
        Toast({ context: this, message: '读取文件失败', theme: 'error' });
        this.setData({ loading: false });
      }
    });
  },

  onSearch(e) {
    const searchValue = e.detail.value || '';
    this.setData({ searchValue }, () => {
      this.filterHeroes();
    });
  },

  filterHeroes() {
    const { heroList, searchValue } = this.data;
    if (!searchValue) {
      this.setData({ filteredHeroList: heroList });
      return;
    }
    
    const filtered = heroList.filter(hero => 
      hero.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    this.setData({ filteredHeroList: filtered });
  }
});