const app = getApp()
Page({
  data: {
    BleConnectStatus:0,
    BleDevices:[],
    ConnectDevices:null,            //已连接设备信息
    ConnectDeviceService:[],        //已连接设备的可用服务
    SelectConnectServices:null,     //选择已连接服务
    CharacteristicsIndex:0,         //特征值定位
    NotifyStatus:false,             //Notify功能
    
    BleReadData:'',                //蓝牙接收数据
    BleNotifyData:'',              //Notify数据
    BleWriteData:''                //蓝牙发送数据   
  },
  // onLoad: function () {},
  开启蓝牙连接:function(){
    //获取蓝牙适配器
    var that = this;
    wx.showLoading({  title: '开启蓝牙适配' });
    wx.openBluetoothAdapter({
      success: function (res) {
        that.获取本机蓝牙状态();
      },
      fail: function (res) {
        wx.hideLoading();
        wx.showModal({title: '失败',content: '初始化蓝牙适配器失败',})
      }
    });
    // wx.onBluetoothAdapterStateChange(function (res) {
    //   var available = res.available;
    //   if (available) {
    //     that.获取本机蓝牙状态();
    //   }
    // })
  },
  点击搜索蓝牙设备: function (e) {
    this.开启蓝牙连接();
  },
  点击断开连接:function(e){
    var that = this;
    wx.closeBLEConnection({
      deviceId: that.data.ConnectDevices.deviceId,
      success: function (res) {
        that.setData({
          BleConnectStatus: 0,
          BleDevices: [],
          ConnectDevices: null,           
          ConnectDeviceService: [], 
        })
      }
    })  
  },
  获取本机蓝牙状态:function(){
    var that = this;
    wx.getBluetoothAdapterState({
      success: function (res) {
        var available = res.available,
          discovering = res.discovering;
        if (!available) {
          wx.showToast({
            title: '设备无法开启蓝牙连接',
            icon: 'success',
            duration: 2000
          })
          setTimeout(function () {
            wx.hideToast()
          }, 2000)
        }
        else {
          if (!discovering) {
            that.开始搜索蓝牙设备();
            setTimeout(function () {
              console.log('停止搜索设备');
              that.停止搜索蓝牙设备();
            }, 5000) 
            // that.获取已绑定蓝牙设备();
          }
        }
      }
    })
  },
  开始搜索蓝牙设备:function(){
    var that = this;
    wx.showLoading({  title: '蓝牙搜索' });
    that.setData({ BleDevices:[]});
    wx.startBluetoothDevicesDiscovery({
      services: [],
      allowDuplicatesKey: false,
      success: function (res) {
        if (!res.isDiscovering){
          console.log('======重新获取蓝牙状态');
          that.获取本机蓝牙状态();
        }
        else{
          console.log('======处理搜索到蓝牙');
          that.处理搜索情况();
        }
      },
      fail: function (err) {
        console.log(err);
      }
    });
  },
  停止搜索蓝牙设备:function(){
    var that = this;
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        wx.hideLoading();
        console.log("停止搜索周边设备" + "/" + JSON.stringify(res.errMsg));
      }
    })  
  },
  处理搜索情况: function () {
    var that = this;
    console.log('onBluetoothDeviceFound');
    wx.onBluetoothDeviceFound(function (res) {
      console.log('发现新蓝牙设备:')
      console.log(res.devices[0]);
      that.data.BleDevices.push(res.devices[0]);
      that.setData({  BleDevices: that.data.BleDevices  })
    })
  },
  点击指定设备:function(e){
    var that = this;
    var Index = e.currentTarget.dataset.numid;
    console.log('名称：' + that.data.BleDevices[Index].name + "Mac:" + that.data.BleDevices[Index].deviceId);
    wx.showLoading({title: '蓝牙连接中'});
    wx.createBLEConnection({
      deviceId: that.data.BleDevices[Index].deviceId,
      success: function (res) {
        console.log(res);
        wx.hideLoading();
        that.setData({
          ConnectDevices: that.data.BleDevices[Index],
          BleConnectStatus:1
        })
        /*  连接成功后获取蓝牙服务  
        名称：BrainLink_Lite       Mac:4B38F07F-C2E7-4AB7-99CE-511DB9E62694
        {isPrimary: true, uuid: "49535343-FE7D-4AE5-8FA9-9FAFD205E455"}
        {isPrimary: true, uuid: "000018F0-0000-1000-8000-00805F9B34FB"}
        {isPrimary: true, uuid: "E7810A71-73AE-499D-8C15-FAA9AEF0C3F2"}
        {isPrimary: true, uuid: "0000180A-0000-1000-8000-00805F9B34FB"}
        */
        wx.getBLEDeviceServices({
          deviceId: that.data.ConnectDevices.deviceId,
          success: function (res) {
            wx.showToast({  title: '连接成功!'  })
            that.获取指定蓝牙特征值();
          },
          fail: function (res) {
            // fail
            wx.hideLoading();
            console.log('获取蓝牙服务失败')
          }
        })
      },
      fail: function () {
        console.log("指定蓝牙设备连接失败");
      },
      complete: function () {
        console.log("指定蓝牙设备连接完成");
      }
    })  
  },
  获取指定蓝牙特征值:function(){
    this.data.CharacteristicsIndex = 0;
    this.data.ConnectDeviceService = [];
    this.循环获取特征值();
  },
  循环获取特征值:function(){
    var that = this;
    if (that.data.CharacteristicsIndex < that.data.ConnectDevices.advertisServiceUUIDs.length){
      wx.getBLEDeviceCharacteristics({
        deviceId: that.data.ConnectDevices.deviceId,
        serviceId: that.data.ConnectDevices.advertisServiceUUIDs[that.data.CharacteristicsIndex],
        success: function (res) {
          for (var j = 0; j < res.characteristics.length; j++) {
              var TempCharacteristics = res.characteristics[j];
              TempCharacteristics["serviceuuid"] = that.data.ConnectDevices.advertisServiceUUIDs[that.data.CharacteristicsIndex];
              that.data.ConnectDeviceService.push(TempCharacteristics);
          }
          that.data.CharacteristicsIndex++;
          that.循环获取特征值();
        },
        fail: function () {
          console.log("fail");
        }
      })
    }
    else{
      that.setData({ ConnectDeviceService: that.data.ConnectDeviceService });  
      console.log("特征值:");
      console.log(that.data.ConnectDeviceService);
    }
  },
  点击指定服务:function(e){
    var that = this;
    var Index = e.currentTarget.dataset.numid;
    console.log(that.data.ConnectDeviceService[Index]);
    that.setData({ 
      SelectConnectServices: that.data.ConnectDeviceService[Index],
      BleConnectStatus:2,
    })
  },
  点击打印机测试:function(e){
    var that = this;
    var hex = '48656C6C6F59590A0D0A0D'
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }))
    console.log(typedArray)
    var buffer1 = typedArray.buffer
    console.log(buffer1)
    wx.writeBLECharacteristicValue({
      deviceId: that.data.ConnectDevices.deviceId,
      serviceId: that.data.SelectConnectServices.serviceuuid,
      characteristicId: that.data.SelectConnectServices.uuid,
      // 这里的value是ArrayBuffer类型  
      value: buffer1,
      success: function (res) {
        console.log("success  指令发送成功");
        console.log(res);
      },
      fail: function (res) {
        // fail
        console.log(res);
      },
      complete: function (res) {
        // complete
      }
    })  
  },
  点击设置出米:function(e){
    var that = this;
    var hex = '5AA50700070800640073'
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {  return parseInt(h, 16)}))
    var buffer1 = typedArray.buffer
    wx.writeBLECharacteristicValue({
      deviceId: that.data.ConnectDevices.deviceId,
      serviceId: that.data.SelectConnectServices.serviceuuid,
      characteristicId: that.data.SelectConnectServices.uuid,
      value: buffer1,
      success: function (res) {
        console.log("success  指令发送成功");
      },
      fail: function (res) {
        console.log(res);
      },
    })  
  },
  点击模拟OK:function(e){
    var that = this;
    var hex = '5AA5050008010009'
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) { return parseInt(h, 16) }))
    var buffer1 = typedArray.buffer
    wx.writeBLECharacteristicValue({
      deviceId: that.data.ConnectDevices.deviceId,
      serviceId: that.data.SelectConnectServices.serviceuuid,
      characteristicId: that.data.SelectConnectServices.uuid,
      value: buffer1,
      success: function (res) {
        console.log("success  指令发送成功");
      },
      fail: function (res) {
        console.log(res);
      },
    })  
  },
  点击Notify功能:function(e){
    var that = this;
    that.setData({ NotifyStatus: !that.data.NotifyStatus});
    wx.notifyBLECharacteristicValueChange({
      state: that.data.NotifyStatus, // 启用 notify 功能  
      deviceId: that.data.ConnectDevices.deviceId,
      serviceId: that.data.SelectConnectServices.serviceuuid,
      characteristicId: that.data.SelectConnectServices.uuid,
      success: function (res) {
        console.log('收到Notify', res.errMsg);
        setTimeout(function () {
          console.log('延迟1000MS');
          console.log('获取notify');
          wx.onBLECharacteristicValueChange(function (res) {
            const hex = that.buf2hex(res.value);
            console.log(hex);
            that.data.BleNotifyData+=hex;
            that.setData({ BleNotifyData: that.data.BleNotifyData})
          })
        }, 1000);
      },
      fail: function () {
        console.log('启用notify功能失败！');
      },
    })
  },
  
  点击返回:function(e){
    var that = this;
    that.setData({
      SelectConnectServices: null,
      BleConnectStatus: 1,
    })
  },

   /**
    * ArrayBuffer 转换为  Hex
    */
    buf2hex: function (buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join(' ');
  }
})
