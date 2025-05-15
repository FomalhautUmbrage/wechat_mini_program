// components/wudaohui-recorder/index.js
import { 
    getPlayerData, 
    savePlayerData, 
    saveWudaohuiRecord, 
    getWudaohuiRecords 
  } from '../../utils/storage-service';
  import { 
    createWudaohuiRecord, 
    updatePlayerStats 
  } from '../../utils/wudaohui-service';
  
  Component({
    /**
     * 组件的属性列表
     */
    properties: {},
  
    /**
     * 组件的初始数据
     */
    data: {
      playerData: [],
      selectedPlayers: [],
      historyRecords: [],
      activeTab: 'record', // 'record', 'history', 'stats'
      dragging: false,
      draggedPlayer: null,
      draggedOverIndex: -1
    },
  
    /**
     * 组件的生命周期
     */
    lifetimes: {
      attached() {
        this.loadData();
      }
    },
  
    /**
     * 组件的方法列表
     */
    methods: {
      // 加载数据
      loadData() {
        const playerData = getPlayerData() || [];
        const historyRecords = getWudaohuiRecords() || [];
        
        this.setData({
          playerData,
          historyRecords: historyRecords.sort((a, b) => b.id - a.id) // 按ID倒序排列
        });
      },
  
      // 切换标签页
      switchTab(e) {
        const { tab } = e.currentTarget.dataset;
        this.setData({ activeTab: tab });
      },
  
      // 选择或取消选择玩家
      togglePlayerSelection(e) {
        const { id } = e.currentTarget.dataset;
        const { selectedPlayers, playerData } = this.data;
        
        const playerIndex = selectedPlayers.findIndex(p => p.id === id);
        
        if (playerIndex !== -1) {
          // 取消选择
          selectedPlayers.splice(playerIndex, 1);
          this.setData({ selectedPlayers });
        } else {
          // 添加选择
          if (selectedPlayers.length >= 8) {
            wx.showToast({
              title: '最多只能选择8名玩家',
              icon: 'none'
            });
            return;
          }
          
          const player = playerData.find(p => p.id === id);
          if (player) {
            this.setData({
              selectedPlayers: [...selectedPlayers, player]
            });
          }
        }
      },
  
      // 开始拖动玩家
      onDragStart(e) {
        const { index } = e.currentTarget.dataset;
        const draggedPlayer = this.data.selectedPlayers[index];
        
        this.setData({
          dragging: true,
          draggedPlayer,
          draggedOverIndex: index
        });
      },
  
      // 拖动中
      onDragOver(e) {
        const { index } = e.currentTarget.dataset;
        if (index !== this.data.draggedOverIndex) {
          this.setData({ draggedOverIndex: index });
        }
      },
  
      // 结束拖动
      onDragEnd() {
        const { selectedPlayers, draggedPlayer, draggedOverIndex } = this.data;
        
        // 重新排序选中的玩家
        const originalIndex = selectedPlayers.findIndex(p => p.id === draggedPlayer.id);
        if (originalIndex !== -1 && originalIndex !== draggedOverIndex) {
          const newOrder = [...selectedPlayers];
          // 删除原位置的玩家
          newOrder.splice(originalIndex, 1);
          // 插入到新位置
          newOrder.splice(draggedOverIndex, 0, draggedPlayer);
          
          this.setData({
            selectedPlayers: newOrder,
            dragging: false,
            draggedPlayer: null,
            draggedOverIndex: -1
          });
        } else {
          this.setData({
            dragging: false,
            draggedPlayer: null,
            draggedOverIndex: -1
          });
        }
      },
  
      // 记录新的武道会
      recordWudaohui() {
        const { selectedPlayers } = this.data;
        
        if (selectedPlayers.length < 2) {
          wx.showToast({
            title: '请至少选择2名玩家',
            icon: 'none'
          });
          return;
        }
        
        try {
          // 创建武道会记录
          const wudaohuiRecord = createWudaohuiRecord(selectedPlayers);
          
          // 保存记录
          const recordSaved = saveWudaohuiRecord(wudaohuiRecord);
          
          if (!recordSaved) {
            throw new Error('保存武道会记录失败');
          }
          
          // 更新玩家数据
          const updatedPlayerData = updatePlayerStats(this.data.playerData, wudaohuiRecord);
          
          // 保存更新后的玩家数据
          const playerDataSaved = savePlayerData(updatedPlayerData);
          
          if (!playerDataSaved) {
            throw new Error('保存玩家数据失败');
          }
          
          // 更新组件数据
          this.setData({
            playerData: updatedPlayerData,
            selectedPlayers: [],
            historyRecords: [wudaohuiRecord, ...this.data.historyRecords],
            activeTab: 'history'
          });
          
          // 触发事件通知父组件数据已更新
          this.triggerEvent('dataUpdated', { updatedPlayerData });
          
          wx.showToast({
            title: '武道会记录成功',
            icon: 'success'
          });
        } catch (error) {
          console.error('记录武道会失败:', error);
          wx.showToast({
            title: '记录失败: ' + error.message,
            icon: 'none'
          });
        }
      },
  
      // 获取按排名顺序的颜色样式
      getRankColor(rank) {
        switch (rank) {
          case 1: return 'gold-rank';
          case 2: return 'silver-rank';
          case 3: return 'bronze-rank';
          default: return '';
        }
      }
    }
  });