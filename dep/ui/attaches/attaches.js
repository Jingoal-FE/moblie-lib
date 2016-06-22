/***********************************************************************************************************************************
*  attaches.js -- 封装附件相关的操作。
*  
*  功能：上传、下载、删除、暂停、续传
*
*  附件状态：preUpload uploading  pause  finish  delete
* 
*  参数传递：
*  		options:{
*  			// 客户端信息
*  			clientMsg:{
*  				uid: '',
*  				cid: '',
*  				client: '',
*  				lang: '',
*  				pause: '',
*  				appver: ''
*  			},
*  			// 已经有的附件信息，没有传空数组，这个主要是用于修改
*  			originAttaches:[
*  				{
*  					id: '', // 附件id
*  					raid: '', // 带前缀RA形式的附件id,用于移动端下载附件
*  					fileName: '', // 附件名称
*  					size: '', // 附件大小
*  					previewUrl: '', // 附件预览地址
*  					downloadUrl: '' // 附件下载地址
*  				}
*  			],
*  			url:{ 
*  				uploadUrl: {
*  					url: '/mgw/approve/attachment/getFSTokensOnCreate',
*  					mothod: 'POST'
*  				}
*  				resumeUrl: {
*  					url: '/mgw/approve/attachment/getFSTokensOnContinue',
*  					mothod: 'POST'
*  				}
*  			},
*  			supportType:[
*  				1, // 本地文件
*  				2, // 网盘文件
*  				3, // 相册图片
*  				4, // 拍照上传
*  				5 // 语音上传
*  			],
* 			dom: {
* 				addBtnDOM: '', // 添加按钮的DOM元素  这里给出选择器  #id  .class
* 				containerDOM: '' // 附件容器DOM元素
* 			},
* 			operateType: //'upload' 或者 'download'   download// 直接将页面嵌入到应用环境中，这里采取的操作是 返回要渲染的字符串，交由应用去处理，等应用渲染完成后调用初始化事件函数初始化事件
*           attachesCount: // 允许上传的附件数量， 不传默认为10个
*  			callback: function(){}
*  		}
*  接口方法：
*  		// 返回一个附件数组
*  		// [
*  		//		{
*  		// 			id: '', // string 附件id,新上传的附件传0， 删除附件毕传
*  		//			fsid: '', // string 附件在fileserver的id, 对于新上传的附件必填
*  		//			fileName: '', // string 文件名称
*  		//			size: '', // 文件大小
*  		//			deleted: false, // 文件删除标志，对于要删除的附件传true, 新上传false
*  		//			resource: '' // 附件来源 1：拍照  2: 本地图片  3：网盘文件  4：语音
*  		//		}
*  		// ]
*  		返回附件信息 -- getAttachesDetail
*  		
*  接口属性：
*  		当前的附件个数 -- attachCount // 移动端附件最多允许上传10个
*  事件：
*  		上传 -- upload
*  		下载 -- download
*  		删除 -- delete
*  		暂停 -- pause
*  		续传 -- resume
*  		
*  设计思路：
*  附件相关信息打算尝试mvc模式 
*  		模型Model -- 计划引入zepto.js的	data模块，将数据保存在内存中，而不是放到DOM元素的data属性中，data属性存在存储缺陷
*  		视图View -- 用mustache渲染
*  		控制器Controller --
*
*  附件还得考虑兼容性问题
************************************************************************************************************************************/
(function(win, doc){
	var Attach, // 附件构造函数
		url, // 上传和续传的URL对象 
		openTag = '<ul class="componentAttaches">',
		lang,
		attachCount,
		clientMsg,
		closeTag = '</ul>',
		newTemplate = '{{#attachmentList}}' +  // 新建模版
                       '<li id="{{attachId}}" class="componentAttachItem" data-status="{{attachStatus}}">' +
                           '<div class="componentAttachContent">' +
                               '<div class="componentAttachDetailWrap {{attachIcon}}">' +
                                   '<div class="componentAttachDetail">' +
									   '<div class="componentAttachNameWrap clearfix">' +
										   '<span class="componentAttachLeft">{{attachName}}</span>' +
										   '<span class="attachRight">{{attachSuffix}}</span>' +
									   '</div>' +
									   '<p class="componentAttachSize">{{attachSize}}</p>' +
								    '</div>' +
								    '{{#processComponent}}' +
										'<div class="componentProcessComponent">' +
											'<div class="componentProcessCircleMask"></div>' +
											'<div class="componentProcessCircleWrapper">' +
												'<div class="componentProcessCircle">' +
													'<div class="componentProcessCircleLeft"><div class="componentLeft"></div></div>' +
													'<div class="componentProcessCircleRight"><div class="componentRight"></div></div>' +
													'<div class="componentProcessCircleStatus componentProcessLoadingStatus"></div>' +
												'</div>' +
											'</div>' +
										'</div>' +
									'{{/processComponent}}' +
								'</div>' +
								'{{#attachStatusIcon}}<span class="componentAttachStatus"></span>{{/attachStatusIcon}}' +
    							'<span class="componentDeleteAttach"></span>' +
							'</div>' +
						'</li>' +
					'{{/attachmentList}}',
		previewTemplate = '{{#attachmentList}}' + 
							'<li id="{{attachId}}" class="componentAttachItem">' + 
								'<div class="componentAttachLine">' + 
									'<div class="componentAttachDetailWrap {{attachIcon}}">' + 
										'<div class="componentAttachDetail">' +
											'<div class="componentAttachNameWrap clearfix">' +
												'<span class="componentAttachLeft">{{attachName}}</span>' +
												'<span class="attachRight">{{attachSuffix}}</span>' +
											'</div>' +
											'<p class="componentAttachSize">{{attachSize}}</p>' +
										'</div>' +
										'{{#attachDownload}}<div class="componentAttachDownload"></div>{{/attachDownload}}' +
									'</div>' +
								'</div>' +
							'</li>' +
						'{{/attachmentList}}',
		language = {
			zh_CN :{
				'localFile': '本地文件',
				'netDiskFile': '企业网盘',
				'albumFile': '相册',
				'cameraFile': '拍照',
				'ok': '确定',
				'cancel': '取消',
				'lackOfSpace': '企业空间的大小不足',
				'fileToolarge': '文件大小超过企业设定，无法上传',
				'uploadFail': '上传失败',
				'deleteAttach': '确定删除此附件？',
				'noNetwork': "当前网络不可用",
				'preView': '预览',
				'unSupprotType': '暂不支持该文件类型预览',
				'pauseFail': '暂停失败',
				'deleteFail': '删除失败',
				'noNetwork': "当前网络不可用",
				'waitUpload': '等待上传...',
				'errorTip': '操作遇到问题，请重试',
				'attachCountLimit': '附件个数限制为',
				'unit': '个'
			},
			zh_TW :{
				'localFile': '本地文件',
				'netDiskFile': '企業網盤',
				'albumFile': '相冊',
				'cameraFile': '拍照',
				'ok': '確定',
				'cancel': '取消',
				'lackOfSpace': '企業空間的大小不足',
				'fileToolarge': '文件大小超過企業設定，無法上傳',
				'uploadFail': '上傳失敗',
				'deleteAttach': '確定刪除此附件？',
				'noNetwork': "當前網絡不可用",
				'preView': '預覽',
				'unSupprotType': '暫不支持該文件類型預覽',
				'pauseFail': '暫停失敗',
				'deleteFail': '刪除失敗',
				'noNetwork': "當前網絡不可用",
				'waitUpload': '等待上傳...',
				'errorTip': '操作遇到問題，請重試',
				'attachCountLimit': '附件個數限制爲', 
				'unit': '個'
			},
			en_US :{}
		};

	// 将模版解析一下留作备用
	Mustache.parse(newTemplate);
	Mustache.parse(previewTemplate);	

	/****************************************** 脚手架 -- start ******************************************/

	// 判断网络是否可用
	function isNetwork(){
        var networkState = null;
        try{
            networkState = navigator.connection.type;
            if(networkState == Connection.NONE){
                 return false;
             }else{
                return true;
             }
        }catch(e){
            console.log('get navigator.connection.type failed!');
        }
    }

    // 弹框组件
    function popupTip(config){
        var popupTipWrap = $('#componentPopupTipWrap'),
            domArr = [
                '<div id="componentPopupTipWrap"><div id="popupTipIcon" class=',
                config.style,
                '></div><div id="componentPopupTipText">',
                config.text,
                '</div></div>'
            ];

        if(popupTipWrap.length>0){
            popupTipWrap.remove();
        }

        $('body').append(domArr.join(''));

        fadeToggle({element: $('#componentPopupTipWrap'), time: config.time});
    }

    // 弹框淡入淡出插件  t:显示时间，默认1秒 ；淡入时间默认0.5s
    function fadeToggle(options){
    	var $mask = options.element,
    		time = options.time || 1000;

    	$mask.css({'display':'block','opacity':'0','transition':'opacity 0.5s ease-out'});
    	setTimeout(function(){$mask.css({'opacity':'1'});},10);
    	var ml = parseInt($mask.width())/2,
            mt = parseInt($mask.height())/2;
        $mask.css({'margin-left':-ml+'px','margin-top':-mt+'px'});
        setTimeout(function(){$mask.css({'opacity':'0'});},time);
        setTimeout(function(){$mask.remove();},time+500);
    }

    //格式化文件大小
    function formatFileSize(size){
    	 return size > (1024*1024) ? ((size/(1024*1024)).toFixed(1) + 'Mb') : size > 1024 ? ((size/1024).toFixed(1) + 'Kb') : (size + 'b');
    }

	// 获取附件类型图标  attachName -- 完整的附件名，包括后缀
	function getAttachesTypeIcon(attachName){
		var attachType, // 附件类型，该变量用于在显示图标的类型
		    dotIndex = attachName.lastIndexOf('.'), // 附件名和后缀之间dot的位置
		    attachSuffix = (dotIndex === -1 ? 'unknowType' : attachName.substring(dotIndex+1)).toLowerCase(); // 附件后缀

		switch(attachSuffix){ // 图片文件处理
		    case 'jpg':
		    case 'png':
		    case 'gif':
		    case 'bmp':
		    case 'jpeg':
		    	attachsType = 'pictureSuffix';
		    	break;
	        case 'avi': // 视频文件处理
	        case 'rmvb':
	        case 'rm':
	        case 'mp4':
	        case 'wmv':
	        case 'asf':
	        case 'divx':
	        case 'mpg':
	        case 'mpeg':
	        case 'mpe':
	        case 'mkv':
	        case 'vob':
	        	attachsType = 'videoSuffix';
	        	break;
	        case 'mp3': // 音频文件处理
	        case 'aac':
	        case 'wav':
	        case 'wma':
	        case 'cda':
	        case 'flac':
	        case 'm4a':
	        case 'mid':
	        case 'ogg':
	        case 'mka':
	        case 'mp2':
	        case 'wv':
	        	attachsType = 'audioSuffix';
	        	break;
	        case 'rar': // 压缩文件处理
	        case 'zip':
	        case 'cab':
	        case 'arj':
	        case 'lzh':
	        case 'ace':
	        case '7-zip':
	        case 'tar':
	        case 'gzip':
	        case 'uue':
	        case 'bz2':
	        case 'jar':
	        case 'iso':
	        case 'z':
	        	attachsType = 'compressSuffix';
	        	break;
	        case 'ppt': // ppt文件处理
	        case 'pptx':
	        	attachsType = 'pptSuffix';
	        	break;
	        case 'doc': // doc文件处理
	        case 'docx':
	        	attachsType = 'docSuffix';
	        	break;
	        case 'xls': // xls文件处理
	        case 'xlsx':
	        	attachsType = 'xlsSuffix';
		    	break;
		    case 'apk': // apk文件处理
		    	attachsType = 'apkSuffix';
		    	break;
	        case 'html': // html文件处理
	        	attachsType = 'htmlSuffix';
	        	break;
	        case 'java': // java文件处理
	        	attachsType = 'javaSuffix';
	        	break;
		    case 'pdf': // pdf文件处理
	        	attachsType = 'pdfSuffix';
	        	break;
		    case 'txt': // txt文件处理
		    	attachsType = 'txtSuffix';
		    	break;
	        default: // 默认为位置文件后缀
	        	attachsType = 'unknowSuffix';
	        	break;
		}

		return {attachSuffix: attachSuffix, attachsType: attachsType};
	}

	// 获取支持的附件类型
	function getAttachmentType(typeOption, context){ // typeOption: 用户传的附件类型编号
	  	var localFileBtn, // 本地文件
	  		netDiskBtn, // 网盘按钮 
	      	albumBtn, // 相册按钮
	      	cameraBtn, // 相机按钮 
	      	
	      	that = context,

	      	buttonGroup = [], // 功能按钮组
	      	cancelBtn, // 取消按钮
	      	attachRendered,
	      	supportType; // 客户端支持的附件类型

	  	// 获取前端支持的类型
	  	CPAttachment.getAttachmentType(function(data){

	    	supportType =  data.rel.supportType;
	    	// 遍历用户提供的附件类型参数
	    	for(var i = 0, len = typeOption.length; i < len; i++){
	    		if((~supportType.indexOf(typeOption[i]))){ // 如果客户端支持该附件类型 则压入类型数组，若不支持，直接忽略。
	    			
	    			// 匹配按钮类型
	    			switch(typeOption[i]){
	    				case 1: // 本地文件功能
	    					buttonGroup.push({
	    						title: lang['localFile'],
	    						callback: function(){
				              		CPAttachment.localFile(function(data){
				                		uploadCallback(data, 'localFile', 1, context);
				              		}, {});
				            	}
	    					});
	    					break;
	    				case 2: // 网盘文件功能
	    					buttonGroup.push({
	    						title: lang['netDiskFile'],
	    						callback: function(){
				              		CPAttachment.netdiskFile(function(data){
				                		uploadCallback(data, 'netDiskFile', 2, context);
				              		}, {});
				            	}
	    					});
	    					break;
	    				case 3: // 相册功能
	    					buttonGroup.push({
	    						title: lang['albumFile'],
		            			callback: function(){
		              				CPAttachment.callAlbum(function(data){
			                			uploadCallback(data, 'albumFile', 3, context);
			              			}, {}, (that.attachesCount - getAttachesCount(that)));
		            			}
	    					});
	    					break;
	    				case 4: // 拍照功能
	    					buttonGroup.push({
	    						title: lang['cameraFile'],
		            			callback: function(){
			              			CPAttachment.callCamera(function(data){
			                			uploadCallback(data, 'cameraFile', 4, context);
			              			}, {});
			            		}
	    					});
	    					break;
	    				default:
	          				break;
	    			}
	    		}
	    	}
	    	// 取消按钮
		    cancelBtn = {
		      	title: lang['cancel'],
		      	callback: function(){}
		    };

		    CPUtils.showActionSheet('', cancelBtn, buttonGroup);
	  	});
	}

	// 进度回调函数
	function uploadCallback(data, attachType, code, context){
		var attachmentList = data.rel.attachmentList, // 原生接口返回的原始数据
			renderData = {}, // 用于渲染的数据
			item, // 需要渲染的单条数据
			attachItem, // 当个附件的详细信息
			fileArray = [], // 文件上传数组
			attachIdArray = [], //该数组用来存放附件的DOM元素上的ID,方便在进度动画上进行控制
			that = context,
			viewModelKey,
			dotIndex; // 后缀名中“.”的位置
		renderData.attachmentList = [];
		// 先判断网络是否可用
		if(!isNetwork()){
			popupTip({style: 'componentErrorIcon', text: lang['noNetwork'], time:2000});
			return;
		}
		// viewModel -- 用来存放数据对象数组
		// 循环接口返回的数据，填充viewModel和renderData
		for(var i = 0, len = attachmentList.length; i < len; i++){
			attachItem = attachmentList[i];
			// 填充数据模型
			viewModelKey = 'newAttach' + ( that.viewModelIndexId++ );
			that.viewModel[viewModelKey] = {
				id: attachItem.attachType == 2 ? attachItem.attachId : '0',
				attachId: attachItem.attachId, // 附件ID
				attachSize: attachItem.attachSize, // 附件大小
				attachType: attachItem.attachType, // 附件来源 本地文件、网盘、相册、拍照、语音和修改审批的时候网关返回的附件数据
				attachName: attachItem.attachName, // 附件名字 完整的附件名，包括名称和后缀
				fsid: '',// 附件的fsid
				attachHash: attachItem.attachHash, //附件的哈希值
				attachStatus: attachItem.attachType == 2 ? 'finish' : 'preUpload', // 等待上传
				previewUrl: attachItem.previewUrl,
				downloadUrl: attachItem.downloadUrl,
				raid: '' // 用于下载
			};
			// 用数组去记录附件的顺序  --  这个应该是上传成功之后记录 比较好些
			that.viewModelArray.push(viewModelKey);

			// 准备渲染数据
			dotIndex = attachItem.attachName.lastIndexOf('.');
			item = {
				attachName: attachItem.attachName.substring(0, dotIndex), // 附件名 -- 不包括后缀名
				attachSuffix: attachItem.attachName.substring(dotIndex), // 附件后缀名
				viewModelIndexId: this.viewModelIndexId++, // 数据模型中数据的Id  用该ID去对应数据模型中的数据
				attachIcon: getAttachesTypeIcon(attachItem.attachName).attachsType, // 附件的图标
				attachId: viewModelKey //该ID指的是附件对应的DOM元素的ID 其值为viewModel中的key值
			};

			// 网盘文件不会出现遮罩层, 状态attachStatus变为finish
			if(attachItem.attachType == 2){
				item.attachStatusIcon = true; // 附件上传的状态
				item.netDiskFile = true;
				item.attachSize = formatFileSize(attachItem.attachSize);
				item.status = 'finish';
		    }else{
		    	item.otherFile = true;
		    	item.processComponent = true; // 进度遮罩
		    	item.status = 'preUpload';
		    	item.attachSize = lang.waitUpload; //formatFileSize(attachItem.attachSize), // 附件大小
		    	// 更新fileArray 该数组用来对 getFSTokensOnCreate 设置参数
				fileArray.push({
					fileName: attachItem.attachName,
				    size: attachItem.attachSize,
				    hash: attachItem.attachHash
				});

				attachIdArray.push(viewModelKey);
		    }

			// 填充渲染的数据
			renderData.attachmentList.push(item);
		}

		// 这里设置延迟500ms是因为从原生界面跳转到H5页面时IOS有渲染bug
		setTimeout(function(){
			// 将数据渲染到界面
			$(that.container).find('.componentAttaches').append(Mustache.render(newTemplate, renderData));
			// 是网盘文件的话不做任何处理，不是网盘文件的话，做如下处理
			if(attachItem.attachType != 2){
				// 先判断网络是否可用, 不可用直接跳出
				if(!isNetwork()){
					popupTip({style: 'componentErrorIcon', text: lang['noNetwork'], time:2000});
					return;
				}

				getFSTokensOnCreate({
					fileArray: fileArray, 
					attachIdArray: attachIdArray,
					context: that
				});
			}else{
				that.callback();
			}
		}, 500);
	}

	function getFSTokensOnCreate(options){
		var that = options.context;
		$.ajax({    
			type: that.url.uploadUrl.mothod || 'POST',
			url: that.url.uploadUrl.url || '',
			dataType: 'json',
			data:  JSON.stringify({files: options.fileArray}),
			timeout: 30000,
			headers:{
                'campo-proxy-request': true
            },
			success: function(data){
				// 请求成功后开始处理进度动画
				dealWithUpload(data.value.respList, options.attachIdArray, that);
			},
			error: function(xhr){
				if(xhr.status == 401){
                    CPWebView.uploadToken(
                        function(){
                            getFSTokensOnCreate(options);
                        },function(){
                        	popupTip({style: 'componentErrorIcon', text: lang['errorTip'], time:2000});
                        }
                    );
                }else{
                    popupTip({style: 'componentErrorIcon', text: lang['errorTip'], time:2000});
                }
			}
		});
	}

	// 处理上传  这里的前提是在请求fsid的时候输入的fileArray和返回的数据中data.value.respList是一一对应的，这个跟网关确认过
	function dealWithUpload(data, ids, context){
		var targetEl, // 附件对应的那个DOM元素
			respListItem, // fsid相关信息
			that = context,
			attachItem; // viewModel中对应的数据 

		for(var i = 0, len = data.length; i < len; i++){
			targetEl = $('#' + ids[i]);
			respListItem = data[i];
			attachItem = that.viewModel[ids[i]];
			// 更新viewModel中的fsid
			attachItem.fsid = data[i].fsid;
			attachItem.attachStatus = 'uploading';
			//这里使用了闭包的方法保存以前的值
			(function(options){
				CPAttachment.startUpload(function(data){// 上传完成回调
					// 处理上传完成函数返回的状态码
					dealWithUploadCode({
						data: data,
						element: options.element,
						success: function(){
							// 如果返回的错误码为0，则代表上传成功，处理上传成功函数
							upLoadFinishHandle({
								data: data,
								element: options.element,
								context: that
							});
						},
						context: that
					});
				}, function(data){// 上传进度回调
					upLoadProcessHandle({
						data: data,
						element: options.element,
						fileSize: options.fileSize					
					});
				}, options.taskId, options.fsId, options.uploadUrl, options.queryUrl);
			})({
				taskId: attachItem.attachId,
				fsId: respListItem.fsid,
				uploadUrl: respListItem.uploadurl,
				queryUrl: respListItem.queryurl,
				element: targetEl,
				fileSize: attachItem.attachSize
			});

		}
	}

	// 处理上传完成函数返回的状态码
	function dealWithUploadCode(param){
		var code = param.data.rel.code, // 上传完成后的状态码处理
			element = param.element,
			that = param.context,
			successCb = param.success,// 成功回调
			statusEl = element.find('.componentAttachSize'); // 文件大小的DOM元素

		switch(code){
			case 0: // 正常状态
				successCb();
				break;
			case 1011: // 企业云空间不足  不可以重新上传
				statusEl.text(lang['lackOfSpace']);
				statusEl.css('color', 'red');
				element.find('.componentProcessCircleWrapper').remove();
				that.viewModel[element[0].id].attachStatus = 'fail';
				break;
			case 1012: // 上传文件大小超过限制  不可以重新上传
				statusEl.text(lang['fileToolarge']);
			    statusEl.css('color', 'red');
			    element.find('.componentProcessCircleWrapper').remove();
			    that.viewModel[element[0].id].attachStatus = 'fail';
			    break;
			default: // 其他情况附件都可以重新上传
				statusEl.text(lang['uploadFail']);
		        statusEl.css('color', 'red'); 
		        // 切换暂停和上传状态
		        element.find('.componentProcessCircleStatus').removeClass('componentProcessLoadingStatus').addClass('componentProcessPauseStatus');
		        element.data('status', 'pause');
		        // 修改数据模型中数据的状态 为暂停状态，之后还可以变为续传
		        that.viewModel[element[0].id].attachStatus = 'pause';
		        break;
		}
	}

	// 附件上传完成回调
	function upLoadFinishHandle(param){
		var data = param.data,
			that = param.context,
			element = param.element,
			viewModelItem = that.viewModel[element[0].id];

		element.find('.componentProcessCircle .componentLeft').css({'transform': "rotate(180deg)", "-webkit-transform": "rotate(180deg)"});
		// 清除遮罩
		element.find('.componentProcessComponent').remove();
		// 添加完成状态
		element.find('.componentAttachContent').append('<span class="componentAttachStatus"></span>');
		// 更新上传完成的文字显示
		element.find('.componentAttachSize').text(formatFileSize(viewModelItem.attachSize));
		// 更新界面元素的状态
		element.data('status', 'finish');
		// 更新数据模型中的状态
		viewModelItem.attachStatus = 'finish';

		that.callback();
	}

	// 附件进度回调
	function upLoadProcessHandle(param){
		var data = param.data,
			that = param.context,
			element = param.element,
			lastSize = element.data('lastsize') || 0, // 取出上一次进度回调中总共传的文件大小
			currentSize = data.rel.offset, // 当前原生返回的文件大小
			fileSize = param.fileSize,
			incrementSize = parseInt(currentSize) - parseInt(lastSize), // 文件大小增量
			currentDegree = Math.ceil(360*(currentSize/fileSize)); //应该走过的环形进度
			//修改文件文件上传的大小
		element.data('lastsize', currentSize);
		element.data('status', 'uploading');
		// 进度动画
		if(currentDegree <= 180){
			element.find('.componentProcessCircle .componentRight').css({'transform': "rotate(" + currentDegree + "deg)", '-webkit-transform': "rotate(" + currentDegree + "deg)"});
		}else{
			element.find('.componentProcessCircle .componentRight').css({'transform': "rotate(180deg)", '-webkit-transform': "rotate(180deg)"});
			element.find('.componentProcessCircle .componentLeft').css('transform', "rotate(" + (currentDegree - 180) + "deg)");
			element.find('.componentProcessCircle .componentLeft').css({'transform': "rotate(" + (currentDegree - 180) + "deg)", '-webkit-transform': "rotate(" + (currentDegree - 180) + "deg)"});
		}

		// 更新上传文字
	    element.find('.componentAttachSize').text( formatFileSize(currentSize) + ' / ' + formatFileSize(fileSize));
	    element.find('.componentAttachSize').css('color', '#707070'); 
	}

	// 得到渲染字符串, 该方法去遍历viewModel视图模型，返回需要渲染的字符串
	function getRenderString(){
		var renderData = {}, // 用于渲染数据 
			attachItem,
			item,
			key,
			template = this.operateType == 'upload' ? newTemplate : previewTemplate,
			dotIndex;

		renderData.attachmentList = [];

		for(key in this.viewModel){
			attachItem = this.viewModel[key];
			// 所有的附件都是处于正常状态才能提交
			if(attachItem.attachStatus == 'finish'){
				dotIndex = attachItem.attachName.lastIndexOf('.');
				
				switch(this.operateType){
					case 'upload':
						//压入要渲染的字符串
						item = {
							attachName: attachItem.attachName.substring(0, dotIndex), // 附件名 -- 不包括后缀名
							attachSuffix: attachItem.attachName.substring(dotIndex), // 附件后缀名
							attachSize: formatFileSize(attachItem.attachSize), // 附件大小
							attachIcon: getAttachesTypeIcon(attachItem.attachName).attachsType, // 附件的图标
							attachId: key, //该ID指的是附件对应的DOM元素的ID 其值为viewModel中的key值
							netDiskFile: true,
							status: 'finish'
						};

						if(attachItem.attachType != 6){//这是详情中传递过来的附件
					    	item.attachStatusIcon = true;
					    }

					  	break;
					case 'download':
						item = {
							attachName: attachItem.attachName.substring(0, dotIndex), // 附件名 -- 不包括后缀名
							attachSuffix: attachItem.attachName.substring(dotIndex), // 附件后缀名
							attachSize: formatFileSize(attachItem.attachSize), // 附件大小
							attachIcon: getAttachesTypeIcon(attachItem.attachName).attachsType, // 附件的图标
							attachId: key //该ID指的是附件对应的DOM元素的ID 其值为viewModel中的key值
						};

						if(parseInt(this.clientMsg.appver.split('.').join('')) >= 610){
							item.attachDownload = true;
						}

						break;
					default:
						break;
				}
				renderData.attachmentList.push(item);

			}
		}
		return openTag + Mustache.render(template, renderData) + closeTag;
	}

	// 初始化事件，考虑到附件构造函数在附件生成前可能已经调用，所以这里请在界面渲染完成后手动调用初始化事件函数。如果等界面初始化后再调用Attach构造函数，在修改附件时会出现界面跳动
	function initEvent(){
		var that = this;
		if(this.operateType == 'upload'){
			// 为添加附件按钮绑定函数
			$(this.addBtn).on('tap', function(e){
				e.stopPropagation();
				if(getAttachesCount(that) < that.attachesCount){
					getAttachmentType(that.supportType, that);
				}else{
					popupTip({style: 'componentErrorIcon', text: lang['attachCountLimit'] + that.attachesCount + lang['unit'], time:2000});
					return;
				}
				
			});

			// 绑定暂停和续传事件，这里用事件代理去配置
			$(this.container + ' .componentAttaches').on('tap', '.componentProcessComponent', function(event){
			    // 网络不可用的情况
				if(!isNetwork()){
					popupTip({style: 'componentErrorIcon', text: lang['noNetwork'], time:2000});
					return;
				}

			    var targetEl = $(this).closest('.componentAttachItem'),
			    	status = targetEl.data('status');

			    switch(status){
			      	case 'pause':
			        	// 如果是暂停状态，则调用续传
			        	resumeCallback(targetEl, that);
			        	break;
			        	// 处于待上传状态
			        case 'preUpload':
			        	preUploadCallback(targetEl, that);
			        	break;
			        	// 如果是上传状态，则调用暂停
			      	case 'uploading':
			        	pasueCallback(targetEl, that);
			        	break;
			      	default:
			        	break;
			    }
			});

			// 绑定删除事件
			$(this.container + ' .componentAttaches').on('tap', '.componentDeleteAttach', function(event){
					var target = this,
					cancelButton = {
						title: lang.cancel,
		          		callback: function(){}
					},
					confirmButton = {
						title: lang.ok,
						callback: function(){
							
							if(!isNetwork()){
								popupTip({style: 'componentErrorIcon', text: lang['noNetwork'], time:2000});
								return;
							}

							var targetEl = $(target).closest('.componentAttachItem'), // li元素 -- 单个附件最外层元素
								attachItem = that.viewModel[targetEl[0].id]; // 当前附件元素对应的视图模型中的数据

							if(attachItem.attachType == 2){ // 如果删除的是网盘文件
								// 清除模型索引中的元素
								that.viewModelArray.splice(that.viewModelArray.indexOf(targetEl[0].id), 1);
								// 清除viewModel视图模型中的数据
								delete that.viewModel[targetEl[0].id];
								// 清除界面元素
								targetEl.remove();
								that.callback();
							}else if(attachItem.attachType == 6){ // 如果是修改场景中传入的附件要删除
								// 清除模型索引中的元素
								that.viewModelArray.splice(that.viewModelArray.indexOf(targetEl[0].id), 1);
								// 这个场景不能删除viewModel视图模型中的数据，该数据在和业务提交时还有关联，但是需要将视图模型中的状态变为delete
								attachItem.attachStatus = 'delete';
								// 清除界面元素
								targetEl.remove();
								that.callback();
							}else{ // 其他场景 
								if(attachItem.attachStatus == 'preUpload'){
									// 清除模型索引中的元素
									that.viewModelArray.splice(that.viewModelArray.indexOf(targetEl[0].id), 1);
									// 清除viewModel视图模型中的数据
									delete that.viewModel[targetEl[0].id];
									// 清除界面元素
									targetEl.remove();
									that.callback();
								}else{
									CPAttachment.cancelUpload(function(data){
						                if(data.rel.code === 0){
						                	// 清除模型索引中的元素
											that.viewModelArray.splice(that.viewModelArray.indexOf(targetEl[0].id), 1);
											// 清除viewModel视图模型中的数据
											delete that.viewModel[targetEl[0].id];
											// 清除界面元素
											targetEl.remove();
						                }else{
						                	// 删除失败
						                	popupTip({style: 'componentErrorIcon', text: lang['deleteFail'], time:2000});
						                	return;
						                }
						                that.callback();
						            }, attachItem.attachId);
								}
								
							}
							// 最后一个li元素是不显示下边框的  元素个数的处理方法
							// todo
						}
					};

				// 显示文件提示框
				CPUtils.showAlertView('', lang.deleteAttach, cancelButton, confirmButton);
			});
		}else if(this.operateType == 'download'){
			// 绑定预览事件
			$(this.container + ' .componentAttaches').on('tap', 'li', function(e){
				if(!isNetwork()){
					popupTip({style: 'componentErrorIcon', text: lang['noNetwork'], time:2000});
					return;
				}
				
				if(e.target.className != 'attachDownload'){
					var element = $(this),
						attachItem =  that.viewModel[element[0].id],
						dotIndex = attachItem.attachName.lastIndexOf('.');

					if(isPreview(attachItem.attachName.substring(dotIndex))){
						CPNavigationBar.redirect(attachItem.previewUrl, lang['preView'], false, function(){});
					}else{
						// 弹框提示，文件不能预览
						popupTip({style: 'componentErrorIcon', text: lang['unSupprotType'], time:2000});
					}
				}
			});

			// 绑定下载事件
			$(this.container + ' .componentAttaches').on('tap', '.componentAttachDownload', function(){
				if(!isNetwork()){
					popupTip({style: 'componentErrorIcon', text: lang['noNetwork'], time:2000});
				}else{
					var element = $(this).closest('.componentAttachItem'),
						attachItem =  that.viewModel[element[0].id],
						taskArr = [{
							fsid: attachItem.raid,
							fileName: attachItem.attachName,
							fileSize: attachItem.attachSize
						}];

					// 通知原生下载文件
					CPAttachment.startDownload(function(data){
						if(data.rel.code === 0){}
					}, taskArr);
				}
			});
		}
	}

	// 续传函数--该回调是针对已经取到fsid的情况  即附件的状态处于uploading状态
	function resumeCallback(element, context){
		var that = context,
			attachItem = that.viewModel[element[0].id],
			lastsize = element.data('lastsize');

		$.ajax({    
			type: that.url.resumeUrl.mothod || 'POST',
			url: that.url.resumeUrl.url || '',
			dataType: 'json',
			data: JSON.stringify({fsids: [attachItem.fsid]}),
			timeout: 30000,
			headers:{
                'campo-proxy-request': true
            },
			success: function(data){
				element.find('.componentProcessCircleStatus').removeClass('componentProcessPauseStatus').addClass('componentProcessLoadingStatus');
				attachItem.attachStatus = 'uploading';
				CPAttachment.startUpload(function(data){
		          	// 上传完成的回调
		          	dealWithUploadCode({
		            	data: data,
		            	element: element,
		            	success: function(){
		            		// 如果返回的错误码为0，则代表上传成功，处理上传成功函数
			              	upLoadFinishHandle({
			              		data: data,
								element: element,
								context: that
			              	});
			            },
			            context: that
		          	});
		        },function(data){
		            //upLoadProcessHandle(data, liTarget);
		            upLoadProcessHandle({
		            	data: data,
						element: element,
						fileSize: attachItem.attachSize,
						context: that	
		            });
		    	}, attachItem.attachId, attachItem.fsid, data.value.respList[0].uploadurl, data.value.respList[0].queryurl);
			},
			error: function(xhr){
				if(xhr.status == 401){
                    CPWebView.uploadToken(
                        function(){
                            resumeCallback(element, context);
                        },function(){
                        	popupTip({style: 'componentErrorIcon', text: lang['errorTip'], time:2000});
                        }
                    );
                }else{
                    popupTip({style: 'componentErrorIcon', text: lang['errorTip'], time:2000});
                }
				// todo 这个错误的话一会处理
			}
		});
	}

	// 续传回调--该回调是针对还没有的到fsid的情况  即附件的状态处于preUpload状态
	function preUploadCallback(element, context){
		var key = element[0].id,
			attachItem = viewModel[key],
			fileArray = [{
				fileName: attachItem.attachName,
			    size: attachItem.attachSize,
			    hash: attachItem.attachHash
			}],
			that = context,
			attachIdArray = [key];

		getFSTokensOnCreate({
			fileArray: fileArray, 
			attachIdArray: attachIdArray,
			context: that
		});
	}

	//暂停函数
	function pasueCallback(element, context){
		var that = context,
			attachItem = that.viewModel[element[0].id];
		CPAttachment.pauseUpload(function(data){
		    if(data.rel.code === 0){
		     	element.data('status', 'pause');
		     	element.find('.componentProcessCircleStatus').removeClass('componentProcessLoadingStatus').addClass('componentProcessPauseStatus');
		    	// 更新数据viewModel的状态
		    	attachItem.attachStatus = 'pause';
		    }else{
		    	// 暂停失败 -- 给出错误提示
		    	popupTip({style: 'componentErrorIcon', text: lang['pauseFail'], time:2000});
		    	return;
		    }
	  	}, attachItem.attachId);
	}

	// 获取修改过的附件信息，主要用于提交时候的参数传递
	function getModifyAttaches(){
		// 这里去遍历 viewModel对象，去取得附件修改信息
		var modifyAttachesArray = [],
			attachItem,
			attachType; // 附件类型

		for(var key in this.viewModel){
			attachItem = this.viewModel[key];
			attachType = attachItem.attachType;
			switch(attachType){
				case 6:
					if(attachItem.attachStatus == 'delete'){
						modifyAttachesArray.push({
							id: attachItem.id,
							fsid: '',
							fileName: attachItem.attachName,
							size: attachItem.attachSize,
							deleted: true,
							resource: attachType
						});
					}
					break;
				default:
					if(attachItem.attachStatus == 'finish'){
						modifyAttachesArray.push({
							id: attachType == 2 ? attachItem.attachId : '0',
							fsid: attachItem.fsid,
							fileName: attachItem.attachName,
							size: attachItem.attachSize,
							deleted: false,
							resource: attachType
						});
					}
					break;
			}
		}

		return modifyAttachesArray;
	}

	// 判断附件是否可以预览  可以预览返回true, 不可以预览返回false
	function isPreview(fileType){
		var fileTypeArray = [
			'doc', 'docx', 'docm', 'rtf', 'wps', 'xls', 'xlsb', 'xlsx', 'xlsm', 'csv', 'et',
			'ppt', 'pps', 'pptm', 'pptx', 'dps', 'txt', 'pdf', 'jpg', 'jpeg', 'gif', 'png',
			'bmp', 'psd', 'ai', 'tif', 'tiff', 'wbmp', 'jpe', 'wmf'
		];

		return ~fileTypeArray.indexOf(fileType) ? false : true;
	}

	// 当前业务审批附件的个数
	function getAttachesCount(context){
		var that = context;
		return that.viewModelArray.length;
	}

	// 删除处于uploading附件，否则会浪费用户流量。这里删除成功和失败都不管了
	function deleteInvalidAttach(){
		var key,
			attachItem;

		for(key in this.viewModel){
			attachItem = this.viewModel[key];
			if(attachItem.attachStatus == 'uploading'){
				CPAttachment.cancelUpload(function(data){
	                if(data.rel.code === 0){
	                }else{}
	            }, attachItem.attachId);
			}
		}
	}

	// 暂停附件上传，该接口用于当附件正在上传时，用户点击提交。应暂停所有上传
	function pauseAttachUploading(){
		var key,
			element,
			attachItem;

		for(key in this.viewModel){
			attachItem = this.viewModel[key];
			element = $('#' + key);
			if(attachItem.attachStatus == 'uploading'){
				CPAttachment.pauseUpload(function(data){
				    if(data.rel.code === 0){
				     	element.data('status', 'pause');
				     	element.find('.componentProcessCircleStatus').removeClass('componentProcessLoadingStatus').addClass('componentProcessPauseStatus');
				    	// 更新数据viewModel的状态
				    	attachItem.attachStatus = 'pause';
				    }else{
				    	// 暂停失败 -- 给出错误提示
				    	popupTip({style: 'componentErrorIcon', text: lang['pauseFail'], time:2000});
				    	return;
				    }
			  	}, attachItem.attachId);
			}
		}
	}

	// 查看所有附件是否上传完成 viewModel中附件的状态是否都是  附件再没有上传完成时，不允许提交，这个由具体使用场景控制
	function isAttachesReady(){
		var isReady, // 判断是否传完
			attachStatus;
		for(var key in this.viewModel){
			attachStatus = this.viewModel[key].attachStatus;
			if(!(attachStatus == 'finish' || attachStatus == 'delete' )){
				isReady = 'noReady';
				break;
			}
		}

		return isReady == 'noReady' ? false : true;
	}
	/****************************************** 脚手架 -- end ******************************************/
	
	/****************************************** 构造函数 -- start ******************************************/
	
	Attach = function(options){
		// 处理传递进来的附件，修改时用到
		var originAttaches = options.originAttaches || [],
			viewModelKey; // 该变量用来做viewModel的key的中间值

		this.attachCount = 0; //当前附件个数，这个字段指和业务相关联的附件的个数，移动端目前最多允许上传10个
		this.viewModel = {}; // 该对象用来存放附件数据
		this.viewModelArray = []; // 该数组用来保证附件的顺序， 值为viewModel中的key值
		this.viewModelIndexId = 0; // 全局唯一的ID, 用来做viewModel的key值
		this.supportType = options.supportType || [];
		this.operateType = options.operateType || '';
		attachCount = this.attachesCount = options.attachesCount || 10;

		// 取出附件容器
		this.container = (options.dom && options.dom.containerDOM) || '';
		this.addBtn = (options.dom && options.dom.addBtnDOM) || '';

		this.url = options.url || {uploadUrl: { url: '', mothod: 'POST'}, resumeUrl: {url: '', mothod: 'POST'}};

		this.clientMsg = options.clientMsg;
		this.callback = options.callback || function(){};	
		lang = language[this.clientMsg.lang];
		// 将传递进来的附件进行处理，将其放到viewModel中
		for(var i = 0, len = originAttaches.length; i < len; i++){
			// viewModel -- 用来存放数据对象的对象
			// viewModelIndex -- 用来索引数据对象的数组
			viewModelKey = 'originAttach' + ( this.viewModelIndexId++ );
			this.viewModel[viewModelKey] = {
				id: originAttaches[i].id,
				attachId: '', // 附件ID
				attachSize: originAttaches[i].size, // 附件大小
				attachType: 6, // 附件来源 本地文件、网盘、相册、拍照、语音和修改审批的时候网关返回的附件数据
				attachName: originAttaches[i].fileName, // 附件名字 完整的附件名，包括名称和后缀
				fsid: '',// 附件的fsid
				attachHash: '', //附件的哈希值
				attachStatus: 'finish', // 已经上传完毕
				previewUrl: originAttaches[i].previewUrl,
				downloadUrl: originAttaches[i].downloadUrl,
				raid: originAttaches[i].raid // 用于下载
			};
			// 用数组去记录附件的顺序
			this.viewModelArray.push(viewModelKey);
		}
	};
	// 挂载数据
	Attach.viewModel = {};
	// options 就是附件的一些信息
	Attach.getRenderString = function(options,appver){
		var optionsObj = {},
			viewModel = Attach.viewModel,
			viewModelKey,
			renderData = {},
			viewModelIndexId,
			dotIndex,
			singleItem,
			single;

		for(var key in options){
			viewModelIndexId = 0;
			renderData.attachmentList = [];
			for(var i = 0, item = options[key], len = item.length; i < len; i++){
				viewModelKey = key + ( viewModelIndexId++ );
				singleItem = item[i];
				// 模型中放的数据
				viewModel[viewModelKey] = {
					id: singleItem.id,
					attachId: '',
					attachSize: singleItem.size, // 附件大小
					attachType: 6, // 附件来源 本地文件、网盘、相册、拍照、语音和修改审批的时候网关返回的附件数据
					attachName: singleItem.fileName, // 附件名字 完整的附件名，包括名称和后缀
					fsid: '',// 附件的fsid
					attachHash: '', //附件的哈希值
					attachStatus: 'finish', // 已经上传完毕
					previewUrl: singleItem.previewUrl,
					downloadUrl: singleItem.downloadUrl,
					raid: singleItem.raid // 用于下载
						
				}
				dotIndex = singleItem.fileName.lastIndexOf('.'); // 附件名和后缀之间dot的位置
				// 渲染数据
				single = {
					attachName: singleItem.fileName.substring(0, dotIndex), // 附件名 -- 不包括后缀名
					attachSuffix: singleItem.fileName.substring(dotIndex), // 附件后缀名
					attachSize: formatFileSize(singleItem.size), // 附件大小
					attachIcon: getAttachesTypeIcon(singleItem.fileName).attachsType, // 附件的图标
					attachId: viewModelKey //该ID指的是附件对应的DOM元素的ID 其值为viewModel中的key值
				};
				if(parseInt(appver.split('.').join('')) >= 610){
					single.attachDownload = true;
				}
				renderData.attachmentList.push(single);
			}
			optionsObj[key] = openTag + Mustache.render(previewTemplate, renderData) + closeTag;
		}
		return optionsObj;
	};
	// 初始化事件
	Attach.initEvent = function(container, lang){
		var viewModel = Attach.viewModel;
		lang = language[lang];
		// 绑定预览事件
		$(container + ' .componentAttaches').on('tap', 'li', function(e){
			if(!isNetwork()){
				popupTip({style: 'componentErrorIcon', text: lang['noNetwork'], time:2000});
				return;
			}
			
			if(e.target.className != 'componentAttachDownload'){
				var element = $(this),
					attachItem =  viewModel[element[0].id],
					dotIndex = attachItem.attachName.lastIndexOf('.');

				if(isPreview(attachItem.attachName.substring(dotIndex))){
					CPNavigationBar.redirect(attachItem.previewUrl, lang['preView'], false, function(){});
				}else{
					// 弹框提示，文件不能预览
					popupTip({style: 'componentErrorIcon', text: lang['unSupprotType'], time:2000});
				}
			}
		});

		// 绑定下载事件
		$(container + ' .componentAttaches').on('tap', '.componentAttachDownload', function(){
			if(!isNetwork()){
				popupTip({style: 'componentErrorIcon', text: lang['noNetwork'], time:2000});
			}else{
				var element = $(this).closest('.componentAttachItem'),
					attachItem =  viewModel[element[0].id],
					taskArr = [{
						fsid: attachItem.raid,
						fileName: attachItem.attachName,
						fileSize: attachItem.attachSize
					}];

				// 通知原生下载文件
				CPAttachment.startDownload(function(data){
					if(data.rel.code === 0){}
				}, taskArr);
			}
		});
	};

	/****************************************** 构造函数 -- end ******************************************/
		
	/****************************************** 原型对象 -- start ******************************************/
	
	Attach.prototype = {// 原型对象
		constructor: Attach, // 原型对象中的constructor重新指向Attach
		initEvent: initEvent, // 初始化事件
		getRenderString: getRenderString, // 该方法用于修改应用附件，应用中本身就带附件，现在考虑应该将渲染字符串传递给调用者，这样调用者利用模版渲染，才能实现整体渲染
		getModifyAttaches: getModifyAttaches, // 得到修改过的附件信息，包括原来已经有的附件和后来新添加的附件
		getAttachesCount: getAttachesCount, //得到和业务相关的审批附件的个数，现在移动端审批附件的个数要求是不大于10，web端没有限制。各个应用场景在提交时需要调用该函数得到附件的个数。
		isAttachesReady: isAttachesReady, // 附件是否都上传完毕，都上传完并且是成功状态
		deleteInvalidAttach: deleteInvalidAttach, // 删除正在上传的附件
		pauseAttachUploading: pauseAttachUploading // 暂停所有上传状态的附件
	};
	
	/****************************************** 原型对象 -- end ******************************************/

	/****************************************** 接口导出 -- start ******************************************/
	
	win.Attach = Attach;

	/****************************************** 接口导出 -- end ******************************************/
})(window, document);