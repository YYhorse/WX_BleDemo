const app = getApp()
Page({
  data: {
    BleConnectStatus:false,
    BleDevices:[],
    ConnectDevices:null,            //已连接设备信息
    BleServices: "",                //连接设备的服务  
    
    writeServicweId: "",            //可写服务uuid  
    writeCharacteristicsId: "",     //可写特征值uuid  
    readServicweId: "",             //可读服务uuid  
    readCharacteristicsId: "",      //可读特征值uuid  
    notifyServicweId: "",           //通知服务UUid  
    notifyCharacteristicsId: "",    //通知特征值UUID  
  },
  // onLoad: function () {},
  点击搜索蓝牙设备: function () {
    this.开启蓝牙连接();
  },
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
          BleConnectStatus:true
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
            console.log('蓝牙服务:', res.services)
            that.data.BleServices = res.services;
            that.setData({ BleServices: that.data.BleServices })
            that.获取指定蓝牙特征值();
          },
          fail: function (res) {
            // fail1
            wx.hideLoading();
            console.log('获取蓝牙服务失败')
          },
          complete: function (res) {
            // complete
            console.log('获取蓝牙服务完成')
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
    var that = this;
    for (var i = 0; i < that.data.ConnectDevices.advertisServiceUUIDs.length;i++){
      wx.getBLEDeviceCharacteristics({
        deviceId: that.data.ConnectDevices.deviceId,
        serviceId: that.data.ConnectDevices.advertisServiceUUIDs[i],
        success: function (res) {
          console.log(res.characteristics);
          // for (var i = 0; i < res.characteristics.length; i++) {
          //   if (res.characteristics[i].properties.notify) {
          //     console.log("11111111", that.data.BleServices[0].uuid);
          //     console.log("22222222222222222", res.characteristics[i].uuid);
          //     that.setData({
          //       notifyServicweId: that.data.BleServices[0].uuid,
          //       notifyCharacteristicsId: res.characteristics[i].uuid,
          //     })
          //   }
          //   if (res.characteristics[i].properties.write) {
          //     that.setData({
          //       writeServicweId: that.data.BleServices[0].uuid,
          //       writeCharacteristicsId: res.characteristics[i].uuid,
          //     })
          //   } else if (res.characteristics[i].properties.read) {
          //     that.setData({
          //       readServicweId: that.data.BleServices[0].uuid,
          //       readCharacteristicsId: res.characteristics[i].uuid,
          //     })
          //   }
          // }
        },
        fail: function () {
          console.log("fail");
        },
        complete: function () {
          console.log("complete");
        }
      })    
    }
  }
  // 获取已绑定蓝牙设备:function(){
  //   var that = this;
  //   wx.getConnectedBluetoothDevices({
  //     services: [that.serviceId],
  //     success: function (res) {
  //       console.log("获取处于连接状态的设备", res);
  //       var devices = res['devices'];
  //       console.log(devices);
  //       // flag = false,
  //       // index = 0,
  //       // conDevList = [];
  //       // devices.forEach(function (value, index, array) {
  //       //   if (value['name'].indexOf('FeiZhi') != -1) {
  //       //     // 如果存在包含FeiZhi字段的设备
  //       //     flag = true;
  //       //     index += 1;
  //       //     conDevList.push(value['deviceId']);
  //       //     that.deviceId = value['deviceId'];
  //       //     return;
  //       //   }
  //       // });
  //       // if (flag) {
  //       //   this.connectDeviceIndex = 0;
  //       //   that.loopConnect(conDevList);
  //       // }
  //       // else {
  //       //   if (!this.getConnectedTimer) {
  //       //     that.getConnectedTimer = setTimeout(function () {
  //       //       that.getConnectedBluetoothDevices();
  //       //     }, 5000);
  //       //   }
  //       // }
  //     },
  //     fail: function (err) {
  //       // if (!this.getConnectedTimer) {
  //       //   that.getConnectedTimer = setTimeout(function () {
  //       //     that.getConnectedBluetoothDevices();
  //       //   }, 5000);
  //       // }
  //     }
  //   });
  // },

})
