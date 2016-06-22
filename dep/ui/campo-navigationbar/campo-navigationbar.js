/**
 * Created by Bart on 15/4/17.
 */
cordova.define("com.jingoal.campo.navigationbar", function(require, exports, moudle) {

	var exec = require('cordova/exec');
	var CPNavigationBar = {

		iCallbackId: Math.floor(Math.random() * 2000000000),
		iCallbacks: [],

		/**
		 *   获取Native Campo版本号
		 *   successCallback:        [callback]返回版本回调
		 **/
		getCampoVersion: function(successCallback) {
			cordova.exec(successCallback, null, "CPNavigationBar", "getCampoVersion", ['']);
		},

		/**
		 *   设置网页标题
		 *   title:              [String]导航条标题
		 *   lineBreakMode:      [String]标题名过长时省略号显示的位置 "middle":aa...zz  "tail":aabb... [默认值]tail
		 *   indicator:          [bool]标题左边是否显示显示莲花转 默认值false
		 **/
		setTitle: function(title, lineBreakMode, indicator) {
			title = title || '';
			lineBreakMode = lineBreakMode || 'tail';
			indicator = indicator || false;
			cordova.exec(null, null, "CPNavigationBar", "setTitle", [title, lineBreakMode, indicator]);
		},

		/**
		 *   设置导航条左边的按钮
		 *   leftButtonInfo:     [object]左键设置信息对象 如果leftButtonInfo为null，隐藏导航栏左键
		 *   var leftButtonInfo = {
		 *      'title' : 'title1',
		 *      'iconPath' : 'icon',
		 *      'callback' : function(){ alert('Hello JavaScritp!'); }
		 *   };
		 **/
		setLeftButton: function(leftButtonInfo) {
			if (leftButtonInfo) {
				var title = leftButtonInfo.title || '';
				var iconPath = leftButtonInfo.iconPath || '';
				var callback = leftButtonInfo.callback;
				cordova.exec(callback, null, "CPNavigationBar", "setLeftButton", [title, iconPath]);
			} else {
				cordova.exec(null, null, "CPNavigationBar", "setLeftButton", ['']);
			}
		},

		/**
		 *   设置导航条右边的按钮
		 *   rightBtnIconPath:   [String]右按钮图标
		 *   rightBtnArr:        [Array]右按钮设置信息列表
		 *   var rightBtnInfo = [{
		 *                          'title' : 'title1',
		 *                          'iconPath' : 'path1',
		 *                          'callback' : function(){ alert('Hello JavaScritp!'); }
		 *                       },
		 *                       {
		 *                          'title' : 'title2',
		 *                          'iconPath' : 'iconPath2',
		 *                          'callback' : function(){ alert('Hello Lua!'); }
		 *                       }];
		 *   CPNavigationBar.setRightButton('notice/img/like.png',rightBtnInfo);
		 **/
		setRightButton: function(rightBtnIconPath, rightBtnArr) {
			if (rightBtnIconPath && rightBtnArr) {
				var btnInfo = [];
				btnInfo[0] = rightBtnArr[0];

				for (var i = rightBtnArr.length - 1; i >= 0; i--) {
					var title = rightBtnArr[i].title;
					var callback = rightBtnArr[i].callback;
					var iconPath = rightBtnArr[i].iconPath;

					var callbackId = null;
					if (callback) {
						callbackId = CPNavigationBar.iCallbackId++;
						CPNavigationBar.iCallbacks[callbackId.toString()] = callback;
					}

					btnInfo[i] = {
						'title': title,
						'iconPath': iconPath,
						'callbackId': callbackId
					};
				};

				cordova.exec(function(callbackId) {
					var callbackImpl = CPNavigationBar.iCallbacks[callbackId];
					callbackImpl && callbackImpl.call(callbackId);
				}, null, "CPNavigationBar", "setNavigationBar", [rightBtnIconPath, btnInfo]);
			} else {
				cordova.exec(null, null, "CPNavigationBar", "setNavigationBar", ['']);
			}
		},

		/**
		 *   设置按钮是否可以点击
		 *   leftOrRight:        [String]设置左/右按钮 'left'/'right'
		 *   enable:             [bool]设置按钮是否可用 true/false 可点击/不可点击
		 **/
		setButtonEnable: function(leftOrRight, enable) {
			var leftOrRight = leftOrRight || '';
			cordova.exec(null, null, "CPNavigationBar", "setButtonEnable", [leftOrRight, enable]);
		},

		/**
		 *   跳转页面
		 *   url:                [string]跳转的页面的地址 (相对地址)
		 *   title:              [string]设置跳转页面的标题
		 *   NavigationBarHidden:[boolean]true 隐藏导航条 false:显示导航条
		 *   pageReturnParam:    [callback]/[string]回传数据的callbackID或默认字符串
		 *   transitionParam:    [object]页面跳转参数
		 **/
		redirect: function(url, title, navigationBarHidden, pageReturnParam, transitionParam) {
			title = title || '';
			transitionParam = transitionParam || {
				transFlag: 0,
				isClosePage: 0
			};
			if (pageReturnParam) {
				var callbackId = -1;
				if (pageReturnParam != "PrePageCallback") {
					callbackId = CPNavigationBar.iCallbackId++;
					CPNavigationBar.iCallbacks[callbackId.toString()] = pageReturnParam;
				}
				cordova.exec(function(callbackId, data) {
					var callbackImpl = CPNavigationBar.iCallbacks[callbackId];
					callbackImpl && callbackImpl.call(callbackId, data);
				}, null, "CPNavigationBar", "redirect", [url, title, navigationBarHidden, callbackId, transitionParam]);
			} else if (navigationBarHidden) {
				cordova.exec(null, null, "CPNavigationBar", "redirect", [url, title, navigationBarHidden]);
			} else {
				cordova.exec(null, null, "CPNavigationBar", "redirect", [url, title]);
			}
		},

		/**
		 *   设置返回上一级界面的数据
		 *   returnStringData:  [object]返回给上一级界面的数据
		 *   callback:   		[callback]返回上一级界面的回调
		 **/
		setPreviousPageReturnStringData: function(returnStringData, callback) {
			returnStringData = returnStringData || '';
			cordova.exec(callback, null, "CPNavigationBar", "setPreviousPageReturnStringData", [returnStringData]);
		},

		/**
		 *   返回上一级界面
		 **/
		returnPreviousPage: function() {
			cordova.exec(null, null, "CPNavigationBar", "returnPreviousPage", ['']);
		},

		/**
		 *   设置导航栏返回键的响应方式
		 *   goBackEnable:   [bool]设置回退方式  true时,点击当前页面的导航栏左键，不返回上一页，campo只调用webview的goBack方法
		 **/
		setWebViewCanGoBack: function(goBackEnable) {
			var goBackEnable = goBackEnable || false
			cordova.exec(null, null, "CPNavigationBar", "setWebViewCanGoBack", [goBackEnable]);
		},

		/**
		 *   标签切换
		 *   callback:       [callback]跳转标签页回调
		 *   tablePage:      [string]跳转标签页的标识
		 *   inparam:        [object]跳转传递的入参
		 * 
		 **/
		tableSwitch: function(callback, tablePage, inparam) {
			cordova.exec(callback, null, "CPNavigationBar", "tableSwitch", [tablePage, inparam]);
		},

		/**
		 *   设置返回回调函数
		 *   callback:       [callback]用户触发返回操作时回调函数
		 *   isIntercept:    [bool]是否拦截返回操作, 若该值为true,用户触发返回页面时不执行返回操作
		 * 
		 **/
		setGoBackHandler: function(callback, isIntercept) {
			cordova.exec(callback, null, "CPNavigationBar", "setGoBackHandler", [isIntercept]);
		}
	};

	moudle.exports = CPNavigationBar;

});