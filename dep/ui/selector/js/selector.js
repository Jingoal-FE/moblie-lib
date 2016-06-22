/**
* @authors duanhj@jingoal.com
* @date    2015-08-24
* @description selector.js  选人组件业务js
*/

//当页全局变量
var Global = {
	templateSearchBody: $('#template-search-main').html(),  //搜索结果模板
	templateTab: $('#template-tab').html(),   				//tab切换模板
	templateTabList: $('#template-tab-list').html(),   		//tab切换子类模板
    templateCrumb: $('#template-crumb').html(),   			//面包屑路径模板
    templateDepartment: $('#template-department').html(),   //部门列表模板
    templatePerson: $('#template-person').html(),   		//全体员工模板
    templateTitle: $('#template-title').html(),   			//职务列表模板
    templateDefined: $('#template-defined').html(),   		//自定义组列表模板
    templateFriend: $('#template-friend').html(),   		//友好企业列表模板
    templateDeptsSelect1: $('#template-depts-select1').html(),   	//部门选择根模板
    templateDeptsSelect2: $('#template-depts-select2').html(),   	//部门选择子模板
    templateTitlesSelect: $('#template-titles-select').html(),   	//职务选择模板
    templateContact1: $('#template-contact1').html(),    	//人员选择模板 有子类 consArr
    templateContact2: $('#template-contact2').html(),    	//人员选择模板 无子类 consArr
    templateLetterNav: $('#templateLetterNav').html(),		//字母导航
    dataRoot: {"value":[]},									//tab根数据
    dataList: {"value":[]},									//选人子数据
    crumb: null,											//面包屑路径
    paramId: getQueryString('paramId') || '',				//localStorage的key
    paramValue: null,										//localStorage的value
    selector: '',											//根数据类型
    s0: '',													//子数据类型
    deptsData: {},											//从移动网关获取数据时 部门列表
    contactsData: {},										//从移动网关获取数据时 人员列表
    titlesData: {},											//从移动网关获取数据时 职务列表
    isFirstRender: true, 									//是否是第一次渲染
    isHasLetternav: false,								    //是否有字母导航
    isEdit: false,           								//是否进行了编辑
    scrollTop: 0, 											//页面滚动的距离
    isScrollToPreTop: false,								//是否滚动至之前的距离
    appver: ''                                              //客户端版本
};
//模板解析
Mustache.parse(Global.templateSearchBody);
Mustache.parse(Global.templateCrumb);
Mustache.parse(Global.templateDepartment);
Mustache.parse(Global.templatePerson);
Mustache.parse(Global.templateContact1);
Mustache.parse(Global.templateContact2);
Mustache.parse(Global.templateLetterNav);

//获取URL参数
function getQueryString(key){
    var reg = new RegExp("(^|&)"+ key +"=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if(r !== null){
        return r[2];
    }
    return null;
}

/*语言资源*/
var LangResource = {
    zh_CN: {
        "byContact": "按员工",
        "byDefined": "自定义组",
        "byDept": "按部门",
        "byDeptTitle": "按部门职务",
        "byFriend": "友好企业",
        "byTitle": "按职务",
        "cancel": "取消",
    	"checkall": "全选",
    	"isGiveUp": "确定放弃此次编辑吗？",
    	"loading": "加载中...",
    	"noneNextDept": "当前没有下一级部门",
    	"ok": "确认",
    	"resultNone": "没有相关结果",
    	"search": "搜索",
    	"searchOut": "退出搜索",
        "selectContact": "选人员",
        "selectDept": "选部门",
        "selectTitle": "选职务",
    	"unTitle": "未分配职务"
    },
    zh_TW: {
        "byContact": "按員工",
        "byDefined": "自定義組",
        "byDept": "按部門",
        "byDeptTitle": "按部門職務",
        "byFriend": "友好企業",
        "byTitle": "按職務",
        "cancel": "取消",
    	"checkall": "全選",
    	"isGiveUp": "確定放棄此次編輯嗎？",
    	"loading": "加載中...",
    	"noneNextDept": "當前沒有下一級部門",
    	"ok": "確認",
    	"resultNone": "沒有相關結果",
    	"search": "搜索",
    	"searchOut": "退出搜索",
        "selectContact": "選人員",
        "selectDept": "選部門",
        "selectTitle": "選職務",
    	"unTitle": "未分配職務"
    }
};

/*语言全局变量*/
var Language = LangResource.zh_CN;

//从本地获取数据
var FetchData = {
	//部门  params = {deptId:部门ID, filter:返回数据类型, groupFlag:分组方式}, callBack:回调函数
	dept: function(params,callBack){
		if(Global.paramValue.dataSource == 2){
			if(params.deptId){
				callBack(Global.deptsData[params.deptId]);
			}else{
				callBack(Global.deptsData);
			}
		}else{
			var options = {
			    "action": "selectPlugin/fetchDept",
			    "parameter": {
			        "deptId": params.deptId || "",
			        "filter": parseInt(params.filter) || 1,
			        "groupFlag": parseInt(params.groupFlag) || 0
			    }
			};
			CPPubData.getPubData(options, function(data){
				if(!data){ return; }
				callBack(data);
			});
		}
	},

	//人员  params = {deptId:部门ID, titleId:职务ID, groupFlag:分组方式}, callBack:回调函数
	contact: function(params,callBack){
		if(Global.paramValue.dataSource == 2){
			callBack(Global.contactsData);
		}else{
			var options = {
			    "action": "selectPlugin/fetchContact",
			    "parameter": {
			        "deptId": params.deptId || "",
			        "titleId": params.titleId || "",
			        "groupFlag": parseInt(params.groupFlag) || 0
			    }
			};
			CPPubData.getPubData(options, function(data){
				if(!data){ return; }
				callBack(data);
			});
		}
	},

	//职务  params = {deptId:部门ID}, callBack:回调函数
	title: function(params,callBack){
		var options = {
		    "action": "selectPlugin/fetchTitle",
		    "parameter": {
		        "deptId": params.deptId || ""
		    }
		};
		CPPubData.getPubData(options, function(data){
			if(!data){ return; }
			callBack(data);
		});
	},

	//自定义组列表  callBack:回调函数
	udefGroups: function(callBack){
		var options = {
		    "action": "selectPlugin/fetchUdefGroups",
			"parameter": null
		};
		CPPubData.getPubData(options, function(data){
			if(!data){ return; }
			callBack(data);
		});
	},

	//自定义组人员  params = {groupId:自定义组ID}, callBack:回调函数
	udefGroupContact: function(params,callBack){
		var options = {
		    "action": "selectPlugin/fetchUdefGroupContact",
		    "parameter": {
		        "groupId": params.groupId
		    }
		};
		CPPubData.getPubData(options, function(data){
			if(!data){ return; }
			callBack(data);
		});
	},

	//友好企业列表  callBack:回调函数
	unCorps: function(callBack){
		var options = {
		    "action": "selectPlugin/fetchUnCorps",
			"parameter": null
		};
		CPPubData.getPubData(options, function(data){
			if(!data){ return; }
			callBack(data);
		});
	},

	//友好企业人员  params = {cid:友好企业ID}, callBack:回调函数
	unCorpsContact: function(params,callBack){
		var options = {
		    "action": "selectPlugin/fetchUnCorpsContact",
		    "parameter": {
		        "cid": params.cid
		    }
		};
		CPPubData.getPubData(options, function(data){
			if(!data){ return; }
			callBack(data);
		});
	},

	//人员信息  params = {jids:[Array]需要获取的人员jid列表, dataFlag:获取数据内容的标识}, callBack:回调函数
	userInfo: function(params,callBack){
		var options = {
		    "action": "pubdata/userInfo",
		    "parameter": {
		        "jids": params.jids,
		        "dataFlag": parseInt(params.dataFlag) || 0
		    }
		};
		CPPubData.getPubData(options, function(data){
			if(!data){ return; }
			callBack(data);
		});
	},

	//人员头像  params = {jid:人员jid, isUpdate:是否主动更新头像}, callBack:回调函数
	contactIcon: function(params,callBack){
		var options = {
		    "action": "pubdata/contactIcon",
		    "parameter": {
		        "jid": params.jid,
		        "isUpdate": parseInt(params.isUpdate) || 0
		    }
		};
		CPPubData.getPubData(options, function(data){
			if(!data){ return; }
			callBack(data);
		});
	},

	//搜索  params = {searchKey:搜索关键字, filter:返回数据类型, userTags:人员标签}, callBack:回调函数
	search: function(params,callBack){
		if(Global.paramValue.dataSource == 2){
			var data = {
				"rel": {
					"depts": [],
					"titles": [],
					"contacts": []
				}
			};
			var consArr = Global.contactsData.rel.contacts[0].consArr;
			for(var i in consArr){
				if(consArr[i].name.indexOf(params.searchKey) != -1){
					data.rel.contacts.push(consArr[i]);
				}
			}
			callBack(data);
		}else{
			var options = {
			    "action": "pubdata/searchContactInfo",
			    "parameter": {
			        "searchKey": params.searchKey || '',
			        "filter": parseInt(params.filter) || 1,
			        "userTags": parseInt(params.userTags) || 1
			    }
			};
			CPPubData.getPubData(options, function(data){
				if(!data){ return; }
				callBack(data);
			});
		}
	}
};

//从网关获取数据
var	FetchAjax = {
	ajax: function(options){
		if(!options.headers){
			options.headers = {};
		}
		$.ajax({
	        type: options.type || "POST",
	        data: options.data || "",
	        url: options.url,
	        dataType: 'json',
	        contentType: 'application/json;charset=utf-8',
	        timeout: 30000,
	        headers: $.extend(true,{"campo-proxy-request": true},options.headers),
	        success: function(data){
				//隐藏loading框
				$('#selector-loading').removeClass('show');
	        	if(data.code !== 0){
	        		$('#selector-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
	        		return;
	        	}
				// //格式化从网关获取的数据
				// FetchAjax.dataFormat(data);
				Selector.onlyContactsRender(data);
	        },
	        error: function(xhr){
	        	if(xhr.status == 401){
	                CPWebView.uploadToken(
	                    function(){
	                        FetchAjax.ajax(Global.params.requestInfo);
	                    },function(){	                        
							//隐藏loading框
							$('#selector-loading').removeClass('show');
				        	$('#selector-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
	                    }
	                );
	            }else{
					//隐藏loading框
					$('#selector-loading').removeClass('show');
		        	$('#selector-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
	            }
	        }
	    });
	},

	//格式化从网关获取的数据
	dataFormat: function(data){
		data = data.value;
		var cid = data.companyId;
		//部门列表、人员列表、职务列表
		Global.deptsData = {
			"rel": {
				"depts": [],
				"titles": [],
				"contacts": [
					{
						"firstLetter": '*',
						"consArr": []
					}
				]
			}
		};
		Global.contactsData = {
			"rel": {
				"contacts": [
					{
						"firstLetter": '*',
						"consArr": []
					}
				]
			}
		};
		Global.titlesData = {
			"rel": {
				"titles": data.titles
			}
		};

		data = data.depts;
		for(var i=0,lenI=data.length; i<lenI; i++){
			//部门列表
			if(data[i].id && data[i].name){
				Global.deptsData.rel.depts.push({"id":data[i].id, "name":data[i].name});
			}
			//人员列表
			if(data[i].contacts){
				var contacts = data[i].contacts;
				for(var j=0,lenJ=contacts.length; j<lenJ; j++){
					var obj = {
						"jid": contacts[j].userId+"@"+cid,
						"name": contacts[j].name,
						"titleId": contacts[j].titleId
					};
					Global.deptsData.rel.contacts[0].consArr.push(obj);
					Global.contactsData.rel.contacts[0].consArr.push(obj);
				}
			}else{
				Global.deptsData.rel.contacts = [];
			}
			//如果有子部门遍历子部门
			if(data[i].id && data[i].name){
				FetchAjax.deptsLoop(data[i]);
			}
		}
		if(data.length === 0){
			Global.deptsData.rel.contacts = [];
		}
		//页面内容初始化
		Selector.renderInit();
	},

	//遍历数据并格式化
	deptsLoop: function(data){
		var id = data.id;
		data = data.subDepts;
		//部门列表
		Global.deptsData[id] = {
			"rel": {
				"depts": [],
				"titles": [],
				"contacts": [
					{
						"firstLetter": '*',
						"consArr": []
					}
				]
			}
		};	
		for(var x=0,lenX=data.length; x<lenX; x++){
			if(data[x].id && data[x].name){
				Global.deptsData[id].rel.depts.push({"id":data[x].id, "name":data[x].name});
			}
			//人员列表
			if(data[x].contacts){
				var contacts = data[x].contacts;
				for(var y=0,lenY=contacts.length; y<lenY; y++){
					var obj = {
						"jid": contacts[y].userId+"@"+cid,
						"name": contacts[y].name,
						"titleId": contacts[y].titleId
					};
					Global.deptsData[id].rel.contacts[0].consArr.push(obj);
					Global.contactsData.rel.contacts[0].consArr.push(obj);
				}
			}else{
				Global.deptsData[id].rel.contacts = [];
			}
			//如果有子部门遍历子部门
			if(data[x].id && data[x].name){
				FetchAjax.deptsLoop(data[x]);
			}
		}
		if(data.length === 0){
			Global.deptsData[id].rel.contacts = [];
		}
	}
};

var Selector = {
	//函数节流
	throttle: function(method,context){
        clearTimeout(method.tId);
        method.tId = setTimeout(function(){
            method.call(context);
        },100);
    },

	//初始化页面语言  demo: <span class="language" data-lang="t|attention">关注</span>
	initLang: function(dom){
	    var $language = $(dom || document).find('.language');
	    for(var i=0,len=$language.length; i<len; i++){
	        var $that = $language.eq(i),
	            arr = $that.attr('data-lang').split("|"),
	            type = arr[0],
	            value = arr[1];
	        switch(type){
	            case 't':
	                $that.text(Language[value]);
	                break;
	            case 'v':
	                $that.val(Language[value]);
	                break;
	            case 'p':
	                $that.attr({'placeholder':Language[value]});
	                break;
	        }
	    }
	},

	//localStorage 取数据
	getItem: function(key,callback){
	    if(!key){
	        return;
	    }
	    try{
	        var value = localStorage.getItem(key);
            var splitReg = new RegExp('^(\<#lsvalid#\>)(.*)(\<\/#lsvalid#\>)$');
            var match = null;
            if (match = value.match(splitReg)) {
                value = match[2];

                try {
                    value = JSON.parse(value);
                }
                catch (ex) {
                    value = null;
                }
            }
	        value = typeof value === 'object' ? value : JSON.parse(value);
	        callback(value);
	        //清除本地存储的数据
	        localStorage.removeItem(key);
	    }
	    catch(e){}
	},

	/* 提示弹框 
     * options = {title:提示标题; message:提示内容; cancelTitle:取消按钮的名字; okTitle:确定按钮的名字;}
     * successCallback:确定按钮的回调，errorCallback:失败按钮的回调 
     */
	showAlert: function(options,successCallback,errorCallback){
        var title = options.title || '',
            message = options.message || '',
            cancelButton = { 
                title : options.cancelTitle || Language.cancel, 
                callback : function(){
                    errorCallback();
                }
            },
            okButton = {
                title: options.okTitle || Language.ok,
                callback: function(){
                    successCallback();
                }
            };
        if(options.cancelTitle){
            CPUtils.showAlertView(title,message,cancelButton,okButton);
        }else{
            CPUtils.showAlertView(title,message,okButton);
        }
    },

	//导航栏左/右按钮是否用
    isLeftButtonEnable: true,
    isRightButtonEnable: true,
    setButtonEnable: function(leftOrRight, enable){
        switch(leftOrRight){
            case 'left':
                if(Selector.isLeftButtonEnable == enable){
                    return;
                }
                Selector.isLeftButtonEnable = enable;
                break;
            case 'right':
                if(Selector.isRightButtonEnable == enable){
                    return;
                }
                Selector.isRightButtonEnable = enable;
                break;
        }
        CPNavigationBar.setButtonEnable(leftOrRight,enable);
    },

    //返回方法
    goBack: function(){
    	$('input,textarea').blur();
        if(!Global.isEdit){
        	CPNavigationBar.returnPreviousPage();
        }else{
        	Selector.showAlert({'message':Language.isGiveUp,'cancelTitle':Language.cancel,'okTitle':Language.ok},function(){
                CPNavigationBar.returnPreviousPage();
            },function(){});
        }
    },

    //标题栏左侧按钮 返回
    setLeftButton: function(){
        CPNavigationBar.setLeftButton({
            title : '',
            iconPath : '',
            callback : Selector.goBack,
        });
    },

    //设置返回回调函数 安卓物理返回键
    setGoBackHandler: function(){
    	if(!(/(iphone|ipad)/i).test(navigator.appVersion) && CPNavigationBar.setGoBackHandler){
	        CPNavigationBar.setGoBackHandler(Selector.goBack, true);
	    }
    },

	//确定 标题栏确定按钮
	setRightButton: function(){
		var len = $('.selector-search .photos .checkedCell').length,
			str = '('+len+')';
		if(len >= 100){
			str = '(99+)';
		}
		if(len === 0){
			str ='';
	        $('.selector-search .photos').html('<i class="icon"></i>');		
		}
		CPNavigationBar.setRightButton('xxx',[
			{
	            title : Language.ok+str,
	            iconPath : '',
	            callback : function(){
	            	//返回的数据
	            	var data = {
		            		"contacts":[],
		            		"depts": [],
		            		"titles": []
		            	},
	            		contacts = $('.selector-search .photos .checkedCell.contacts'),
	            		depts = $('.selector-search .photos .checkedCell.depts'),
	            		titles = $('.selector-search .photos .checkedCell.titles');
	            	//人员数据
				    for(var x=0,lenX=contacts.length; x<lenX; x++){
				    	var objX = {
				    		"jid": contacts.eq(x).attr("data-id") || '',
				    		"name": contacts.eq(x).attr("data-name") || '',
				    		"titleId": contacts.eq(x).attr("data-titleId") || '',
				    		"titleName": contacts.eq(x).attr("data-titleName") || '',
				    		"deptId": contacts.eq(x).attr("data-deptId") || '',
				    		"deptName": contacts.eq(x).attr("data-deptName") || ''
				    	};
				    	data.contacts.push(objX);
				    }
				    //部门数据
				    for(var y=0,lenY=depts.length; y<lenY; y++){
				    	var objY = {
				    		"id": depts.eq(y).attr("data-id") || '',
				    		"name": depts.eq(y).attr("data-name") || ''
				    	};
				    	data.depts.push(objY);
				    }
				    //职务数据
				    for(var z=0,lenZ=titles.length; z<lenZ; z++){
				    	var objZ = {
				    		"id": titles.eq(z).attr("data-id") || '',
				    		"name": titles.eq(z).attr("data-name") || ''
				    	};
				    	data.titles.push(objZ);
				    }
				    //返回的数据
	            	Selector.returnDataFunc(data);
	            }
	    	}
	    ]);
		if(!Global.isEdit){
			Selector.setButtonEnable('right',false);
		}else{
			Selector.setButtonEnable('right',true);
		}
	},

	//返回上一页的数据 并返回
	returnDataFunc: function(data){
	    data = typeof data === 'string' ? data : JSON.stringify(data);
        // //版本判断 版本大于7的 使用新的返回数据方法
        // if(parseInt(Global.appver) >= 7){
    	   //  CPNavigationBar.setPreviousPageReturnStringData(data,function(){
        //         CPNavigationBar.returnPreviousPage();
        //     });
        // }else{
            CPNavigationBar.setPreviousPageReturnStringData(data);
    	    //返回
    	    setTimeout(function(){
    	    	CPNavigationBar.returnPreviousPage();
    	    },500);
        //}
	},

	//参数初始化
	paramsInit: function(data){
        //版本
        Global.appver = data.clientMsg.appver;
		//语言
		Language = LangResource[data.clientMsg.lang] || LangResource.zh_CN;
		/*tab根数据 : 选人员 选职务 选部门*/
		var tabData = [
			{
				"name": Language.selectContact,
				"id": "1000",
			},
			{
				"name": Language.selectDept,
				"id": "2000"
			},
			{
				"name": Language.selectTitle,
				"id": "3000"
			}
		];
		/*选人子数据 : 友好企业 自定义组 按部门职务 按职务 按员工 按部门*/
		var contactTabData = [
			{
				"name": Language.byDept,
				"id": "1001"
			},
			{
				"name": Language.byContact,
				"id": "1002"
			},
			{
				"name": Language.byTitle,
				"id": "1003"
			},
			{
				"name": Language.byDeptTitle,
				"id": "1004"
			},
			{
				"name": Language.byDefined,
				"id": "1005"
			},
			{
				"name": Language.byFriend,
				"id": "1006"
			}
		];

		//标题栏按钮设置
		Selector.setRightButton();
		Selector.setLeftButton();
		Selector.setGoBackHandler();

		//根数据选项
		Global.s0 = data.selector.contact = parseInt(data.selector.contact) || 0;
		data.selector.title = parseInt(data.selector.title) || 0;
		data.selector.dept = parseInt(data.selector.dept) || 0;

		if(data.selector.contact && data.selector.title && data.selector.dept){
			Global.selector = 7;
		}
		if(data.selector.contact===0 && data.selector.title===0 && data.selector.dept){
			Global.selector = 1;
		}
		if(data.selector.contact===0 && data.selector.title && data.selector.dept===0){
			Global.selector = 2;
		}
		if(data.selector.contact===0 && data.selector.title && data.selector.dept){
			Global.selector = 3;
		}
		if(data.selector.contact && data.selector.title===0 && data.selector.dept===0){
			Global.selector = 4;
		}
		if(data.selector.contact && data.selector.title===0 && data.selector.dept){
			Global.selector = 5;
		}
		if(data.selector.contact && data.selector.title && data.selector.dept===0){
			Global.selector = 6;
		}

		//tab数据
		var tabArr = [data.selector.contact, data.selector.title, data.selector.dept];
		for(var i=0,lenI=tabArr.length; i<lenI; i++){
			if(tabArr[i] != 0){
				Global.dataRoot.value.push(tabData[i]);
			}
		}

		//选人数据
		var contactArr = Global.s0.toString(2).split('');
		for(var j=0,lenJ=contactArr.length; j<lenJ; j++){
			if(contactArr[j] == '1'){
				Global.dataList.value.push(contactTabData[j]);
			}
		}

		//网关获取数据格式化
		if(data.dataSource === 2){
			//网关获取数据时会有loading
			$('#selector-loading').addClass('show');
			FetchAjax.ajax(data.requestInfo);
		}else{
			//页面渲染初始化
			Selector.renderInit();
		}	
	},

	//只是获取人员 从网关获取的人员数据处理
	onlyContactsRender: function(data){
		//当只是选人时，搜索和tab导航隐藏掉 内容上移
		$('#selector-body-out').addClass('top0');
		data = {
			"rel": data.value
		};
		//人员渲染
		Selector.contactRender({data:data, renderType:'contact2'});
	},

	//tab切换初始化
	tabInit: function(dom){
		dom.on('tabLoad',function(){
			var that = this;
			if($(that).find('.selector-tab-content li').length){
				$(that).find('.selector-tab-head i').addClass('arrow');
			}

			//tab切换
			$(that).on('tap','.selector-tab-head',function(e){
				//如果当前显示则返回，否则显示
				if($(that).is('.show')){
					$(that).is('.show-down') ? $(that).removeClass('show-down') : $(that).addClass('show show-down');
				}else{
					$(that).addClass('show').siblings('.selector-tab').removeClass('show show-down');
					$(that).is('.show-down') ? $(that).removeClass('show-down') : $(that).addClass('show show-down');
					//渲染tab
					Selector.tabRender($(that).attr('data-id'));
				}
				//清空字母导航
				$('#selector-letter-nav').html('').removeClass('show');
				//设置tab下拉列表是否可以滚动
				Selector.setTabListScroll();
				//根面包屑渲染
				Selector.crumbRootRender({id:$(that).attr('data-id'), text:$(that).find('.selector-tab-head .kind').text()});
			});

			//选择tab子类
			$(that).on('tap','.selector-tab-content li',function(e){
				var name = $(this).text(),
					id = this.id;
				$(this).addClass('checked').siblings('li').removeClass('checked');
				$(that).find('.selector-tab-head .kind em').text(' · '+name);
				$(that).attr('data-id',$(this).attr('data-id')).removeClass('show-down');
				//渲染tab子类
				Selector.tabRender($(this).attr('data-id'));
				//根面包屑渲染
				Selector.crumbRootRender({id:$(that).attr('data-id'), text:$(that).find('.selector-tab-head .kind').text()});
			});

			$('.selector-search').on('tap',function(){
				$(that).removeClass('show-down');
			});

			$(that).on('tap','.selector-tab-content',function(e){
				$(that).removeClass('show-down');
			});
		});
		//触发执行
		dom.trigger('tabLoad');
	},

	//tab数据渲染
	tabRender: function(id){
		switch(id){
			//选部门
			case '2000':
				Selector.departmentListRender({id:'', deptId:'', filter:1, groupFlag:0, dataType:'deptSelect1'});			
				break;
			//选职务
			case '3000':
				FetchData.title({deptId:''},function(data){
					var render = Mustache.render(Global.templateTitlesSelect,data);
					$('#selector-main').html(render);
					//单选样式
					Selector.singleStyle();
					//设置内容区域是否可以滚动
					Selector.setScroll();
					//遍历已经选择的元素
					Selector.eachChecked();
				});				
				break;
			//选人员·按部门
			case '1001':
				if(Global.paramValue.filter.enabled.depts[0]){
					//当只是通过特定部门选人时，搜索和tab导航隐藏掉
					if(Global.selector==4 && Global.s0==1){
						$('#selector-top').removeClass('show');
						$('#selector-header-out').removeClass('show');
						$('#selector-body-out').addClass('top0');
					}
					Selector.contactListRender({id:'', deptId:Global.paramValue.filter.enabled.depts[0], groupFlag:0, dataType:'contact'});
				}else{
					Selector.departmentListRender({id:'', filter:5, groupFlag:0, dataType:'dept'});
				}
				break;
			//选人员·按员工
			case '1002':
				//获取数据 
				FetchData.contact({deptId:'',titleId:'',groupFlag:1},function(data){
					if(!data.rel.contacts || !data.rel.contacts[0].consArr){
						$('#selector-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
						return;
					}
					var Data = data;
					var contact = Data.rel.contacts,
						letterArr = [],	//字母数组
						jidArr = [];	//jid数组				
					for(var i=0,lenI=contact.length; i<lenI; i++){
						letterArr.push(contact[i].firstLetter);
						for(var j=0,lenJ=contact[i].consArr.length; j<lenJ; j++){
							//name为空的数据删除
							if(!contact[i].consArr[j].name){
								contact[i].consArr.splice(j,1);
							}
							//数据去重
							if(jidArr.indexOf(contact[i].consArr[j].jid) == -1){
								jidArr.push(contact[i].consArr[j].jid);
							}else{
								contact[i].consArr.splice(j,1);
							}
						}
					}
					//数据渲染
					var render = Mustache.render(Global.templatePerson,Data),
						renderLetter = Mustache.render(Global.templateLetterNav,Data);
					$('#selector-main').html(render);
					$('#selector-letter-nav').html(renderLetter);

					//如果是从网关获取的数据 隐藏导航字母
					if(Global.paramValue.dataSource == 2){
						Global.isHasLetternav = false;
						$('.selector-person-tag').css({'display':'none'});
						return;
					}else{
						Global.isHasLetternav = true;
						//字母导航条
						Selector.letterNav(letterArr);
					}

					//设置内容区域是否可以滚动
					Selector.setScroll();
					//遍历已经选择的元素
					Selector.eachChecked();
					//获取头像
					Selector.getPhotos();
					//只有当有全选按钮且全选按钮可用时，才一次性加载人员的所有信息，否则随着滑动分布加载
					if($('.selector-checkall').length && !$('.selector-checkall').is('.checkunable')){
						//人员更多信息
						Selector.moreInfoRender(jidArr);
					}
				});				
				break;
			//选人员·按职务
			case '1003':
				if(Global.paramValue.filter.enabled.titles[0]){
					//当只是通过特定职务选人时，搜索和tab导航隐藏掉
					if(Global.selector==4 && Global.s0==4){
						$('#selector-top').removeClass('show');
						$('#selector-header-out').removeClass('show');
						$('#selector-body-out').addClass('top0');
					}
					Selector.contactListRender({id:Global.paramValue.filter.enabled.titles[0], deptId:'', groupFlag:0, dataType:'contact'});
				}else{
					Selector.departmentListRender({id:'', filter:2, groupFlag:0, dataType:'dept'});
				}
				break;
			//选人员·按部门职务
			case '1004':
				Selector.departmentListRender({id:'', filter:3, groupFlag:0, dataType:'dept'});
				break;
			//选人员·自定义组
			case '1005':
				Selector.departmentListRender({id:'', dataType:'udefGroups'});
				break;
			//选人员·友好企业
			case '1006':
				Selector.departmentListRender({id:'', dataType:'unCorps'});
				break;
		}
	},

	//部门列表  params = {id:当前id, text:当前innerText, filter:返回数据类型, groupFlag:分组方式, dataType:数据种类}, isCrumbPath:是否点击了面包屑路径
	departmentListRender: function(params,isCrumbPath){
		switch (params.dataType){
			case 'dept': 	//获取部门列表
				FetchData.dept({deptId:params.id, filter:params.filter, groupFlag:params.groupFlag},function(data){
					//子面包屑渲染
					if(params.id && !isCrumbPath){
						Selector.crumbPathRender(params);
					}
					var Data = data,
						render = '',
                        jidArr = [];    //jid数组
					if(Data.rel.contacts.length){
						var consArr = Data.rel.contacts[0].consArr;
						for(var i=0,lenI=consArr.length; i<lenI; i++){
							//name为空的数据删除
							if(!consArr[i].name){
								consArr.splice(i,1);
							}
							//数据去重
							if(jidArr.indexOf(consArr[i].jid) == -1){
								jidArr.push(consArr[i].jid);
							}else{
								consArr.splice(i,1);
							}
						}
					}
					//数据渲染
					if(params.undefinedDept){
						//未分配部门人员直接显示
						// render = Mustache.render(Global.templateDepartment,Data);
						// $('#selector-main').append(render);
					}else{
						if((!Data.rel.contacts.length || !Data.rel.contacts[0].consArr.length) && !Data.rel.depts.length && !Data.rel.titles.length){
							$('#selector-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
						}else if(Data.rel.contacts.length && !Data.rel.depts.length && !Data.rel.titles.length){
							render = Mustache.render(Global.templateContact1,Data);
							$('#selector-main').html(render);
							//单选样式
							Selector.singleStyle();
						}else{
							render = Mustache.render(Global.templateDepartment,Data);			
							$('#selector-main').html(render);
							if(!Data.rel.contacts.length || !Data.rel.contacts[0].consArr.length){
								$('.selector-list').css({'display':'none'});
							}
						}

						//部门列表跳转
						$('.selector-group').on('tap','.item-depts',function(){
							Selector.departmentListRender({id:this.id, text:$(this).text(), filter:params.filter, groupFlag:params.groupFlag, dataType:'dept'});
						});
						//职务列表跳转
						$('.selector-group').on('tap','.item-titles',function(){
							Selector.contactListRender({id:this.id, text:$(this).text(), deptId:params.id, groupFlag:0, dataType:'contact'},true);
						});

						//未分配部门处理
						if($('#0').length){
							$('#0').css({'display':'none'});
							// if(params.filter==5 || params.filter==7){
							// 	Selector.departmentListRender({id:$('#0')[0].id, text:$('#0').text(), filter:params.filter, groupFlag:params.groupFlag, dataType:'dept', undefinedDept:1},true);
							// }
						}
					}					

					//设置内容区域是否可以滚动
					Selector.setScroll();
					//遍历已经选择的元素
					Selector.eachChecked();

					//获取人员信息
					if(Data.rel.contacts.length){
						//获取头像
						Selector.getPhotos();
						//只有当有全选按钮且全选按钮可用时，才一次性加载人员的所有信息，否则随着滑动分布加载
						if($('.selector-checkall').length && !$('.selector-checkall').is('.checkunable')){
							//人员更多信息
							Selector.moreInfoRender(jidArr);
						}
					}					
				});
				break;
			case 'udefGroups': 	//获取自定义组列表
				FetchData.udefGroups(function(data){
					//子面包屑渲染
					if(params.id && !isCrumbPath){
						Selector.crumbPathRender(params);
					}
					var render = Mustache.render(Global.templateDefined,data);
					$('#selector-main').html(render);
					if(!data.rel.udefGroups.length){
						$('#selector-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
					}else{
						$('#selector-main').html(render);
					}
					//设置内容区域是否可以滚动
					Selector.setScroll();
					//遍历已经选择的元素
					Selector.eachChecked();
					//部门列表跳转
					$('.selector-group li').on('tap',function(){
						Selector.contactListRender({id:this.id, text:$(this).text(), dataType:'udefGroupContact'},true);
					});
				});
				break;
			case 'unCorps': 	//获取友好企业列表
				FetchData.unCorps(function(data){
					//子面包屑渲染
					if(params.id && !isCrumbPath){
						Selector.crumbPathRender(params);
					}
					var render = Mustache.render(Global.templateFriend,data);
					if(!data.rel.uncorps.length){
						$('#selector-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
					}else{
						$('#selector-main').html(render);
					}
					//设置内容区域是否可以滚动
					Selector.setScroll();
					//遍历已经选择的元素
					Selector.eachChecked();
					//部门列表跳转
					$('.selector-group li').on('tap',function(){
						Selector.contactListRender({id:this.id, text:$(this).text(), dataType:'unCorpsContact'},true);
					});
				});
				break;
			case 'deptSelect1':
				//获取部门数据
				FetchData.dept({deptId:params.deptId, filter:params.filter, groupFlag:params.groupFlag},function(data){
					//子面包屑渲染
					if(params.id && !isCrumbPath){
						Selector.crumbPathRender(params);
					}
					var render = Mustache.render(Global.templateDeptsSelect1,data);
					$('#selector-main').html(render);
					//未分配部门不显示
					$('#selector-body .checkable[data-id="0"]').parent('.item').css({'display':'none'});
					//设置内容区域是否可以滚动
					Selector.setScroll();
					//遍历已经选择的元素
					Selector.eachChecked();
					//部门选择跳转
					$('.selector-depts-ul').on('tap','.item i',function(){
						Selector.departmentListRender({id:$(this).parent('.item').attr('data-id'), text:$(this).parent('.item').find('.name').text(), deptId:$(this).parent('.item').attr('data-id'), filter:params.filter, groupFlag:params.groupFlag, dataType:'deptSelect2'});
					});
				});
				break;
			case 'deptSelect2':
				//获取部门数据
				FetchData.dept({deptId:params.deptId, filter:1, groupFlag:0},function(data){
					//子面包屑渲染
					if(params.id && !isCrumbPath){
						Selector.crumbPathRender(params);
					}
					var render = Mustache.render(Global.templateDeptsSelect2,data);
					if(!data.rel.depts.length){
						$('#selector-body').css('background','#fff');
						$('#selector-main').html('<div class="selector-error-dept">'+Language.noneNextDept+'</div>').css('background','#fff');
					}else{
						$('#selector-main').html(render);
						//单选样式
						Selector.singleStyle();
					}
					//设置内容区域是否可以滚动
					Selector.setScroll();
					//遍历已经选择的元素
					Selector.eachChecked();
					//部门选择跳转
					$('.selector-depts-ul').on('tap','.item i',function(){
						Selector.departmentListRender({id:$(this).parent('.item').attr('data-id'), text:$(this).parent('.item').find('.name').text(), deptId:$(this).parent('.item').attr('data-id'), filter:params.filter, groupFlag:params.groupFlag, dataType:'deptSelect2'});
					});
				});
				break;
		}			
	},

	//获取人员  params = {id:当前id, text:当前innerText, deptId:部门ID, groupFlag:分组方式, dataType:数据种类}, isShowCrumb:是否展示面包屑
	contactListRender: function(params,isShowCrumb){
		switch (params.dataType){
			case 'contact': 	//获取人员数据		
				FetchData.contact({deptId:params.deptId, titleId:params.id, groupFlag:params.groupFlag},function(data){
					//子面包屑渲染
					if(params.id && isShowCrumb){
						Selector.crumbPathRender(params);
					}
					Selector.contactRender({data:data, renderType:'contact1'});
				});
				break;
			case 'udefGroupContact': 	//获取自定义组人员
				FetchData.udefGroupContact({groupId:params.id},function(data){
					//子面包屑渲染
					if(params.id && isShowCrumb){
						Selector.crumbPathRender(params);
					}
					Selector.contactRender({data:data, renderType:'contact2'});
				});
				break;
			case 'unCorpsContact': 		//获取友好企业人员
				FetchData.unCorpsContact({cid:params.id},function(data){
					//子面包屑渲染
					if(params.id && isShowCrumb){
						Selector.crumbPathRender(params);
					}
					Selector.contactRender({data:data, renderType:'contact2'});
				});
				break;
		}	
	},

	//人员渲染 params = {data:data数据, renderType:模板类型}
	contactRender: function(params){
		var data = params.data,
			render = '',
            jidArr = [];    //jid数组
		if(data.rel.contacts.length){
			var consArr = data.rel.contacts[0].consArr || data.rel.contacts;
			for(var i=0,lenI=consArr.length; i<lenI; i++){
				//name为空的数据删除
				if(!consArr[i].name){
					consArr.splice(i,1);
				}
				//数据去重
				if(jidArr.indexOf(consArr[i].jid) == -1){
					jidArr.push(consArr[i].jid);
				}else{
					consArr.splice(i,1);
				}
			}
		}

		//数据渲染
		switch (params.renderType){
			case 'contact1': 	//有子类 consArr
				render = Mustache.render(Global.templateContact1,data);
				if(!data.rel.contacts.length){
					$('#selector-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
				}else{
					$('#selector-main').html(render);
					//单选样式
					Selector.singleStyle();
				}
				break;
			case 'contact2': 	//无子类 consArr
				render = Mustache.render(Global.templateContact2,data);
				if(!data.rel.contacts.length){
					$('#selector-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
				}else{
					$('#selector-main').html(render);
					//单选样式
					Selector.singleStyle();
				}
				break;
			case 'search': 	//搜索结果
				render = Mustache.render(Global.templateSearchBody,data);
				if(!data.rel.depts.length && !data.rel.titles.length && !data.rel.contacts.length){
					$('#selector-search-main').html('<div class="selector-error">'+Language.resultNone+'</div>');
				}else{
					$('#selector-search-main').html(render);
				}			
				if(!data.rel.depts.length){$('.search-depts-title').css('display','none');}
				if(!data.rel.titles.length){$('.search-titles-title').css('display','none');}
				if(!data.rel.contacts.length){$('.search-contacts-title').css('display','none');}
				break;
		}

		//设置内容区域是否可以滚动
		Selector.setScroll();
		//遍历已经选择的元素
		Selector.eachChecked();
		//获取头像
		Selector.getPhotos();
		//只有当有全选按钮且全选按钮可用时，才一次性加载人员的所有信息，否则随着滑动分布加载
		if($('.selector-checkall').length && !$('.selector-checkall').is('.checkunable')){
			//人员更多信息
			Selector.moreInfoRender(jidArr);
		}
	},

	//面包屑root数据  root = {id:根目录id, text:根目录的innerText}
	crumbRootRender: function(root){
		Global.crumb = {
			"root": {
				"id": root.id,
				"name": root.text
			}
		};
		var renderCrumb = Mustache.render(Global.templateCrumb,Global.crumb);
		$('#selector-crumb').html(renderCrumb);
	},

	//面包屑path数据
	crumbPathRender: function(params){
		var paramString = JSON.stringify(params).replace(/"/g,'\^');
		$('.selector-crumb span').last().addClass('path');
		$('.selector-crumb').append('<span class="path" id="'+params.id+'" data="'+paramString+'">'+params.text+'<i></i></span>');
		//面包屑样式
		$('#selector-header').css('display','none');
		$('#selector-crumb').css({'display':'block'});
		$('.selector-crumb .path').last().removeClass('path');
	},

	//字母导航条
	letterNav: function(letterArr){
		//导航条位置位置适配不同分辨率
		var wH = window.innerHeight, 			//页面高度
			navHeight = wH - 120, 				//导航条的高度  120:距离顶部距离+top+bottom+padding
			navUnitHeight = navHeight/letterArr.length, 				//每一个导航单元的高度  
			navUnitFontSize = navUnitHeight >= 14 ? 14 : navUnitHeight; //每一个导航条单元的字体大小

		//导航条样式重置
		$('.selector-person-nav').css({
			'fontSize': navUnitFontSize+'px'
		}).find('li').css({
			'height': navUnitHeight,
			'max-height': '20px'
		});	

		// 应用 touchMove 事件实现字母导航操作
		$('.selector-person-nav').on('touchstart touchmove',function(e){
            e.preventDefault();
			$(this).addClass('active');
			var arrIndex = parseInt((e.touches[0].clientY - 110)/e.target.offsetHeight);
			if(arrIndex<0 || arrIndex>=letterArr.length){
                $('.selector-person-nav').removeClass('active');
				$('.selector-person-tip').css('display', 'none');
				return;
			}
			$('.selector-person-tip').html(letterArr[arrIndex]).css('display', 'block');
			$('#selector-body').scrollTop($('.selector-person-tag[data-letter="'+letterArr[arrIndex]+'"]')[0].offsetTop);
		}).on('touchend touchcancel', function(e){
            e.preventDefault();
            $('.selector-person-nav').removeClass('active');
            setTimeout(function(){
                $('.selector-person-tip').css('display', 'none');
            },20);
		});
	},

	//设置内容区域是否可以滚动
	setScroll: function(){
		var H = $('#selector-body')[0].offsetHeight,
			h = $('#selector-main')[0].offsetHeight+10,
			sh = $('#selector-search-main')[0].offsetHeight;
		if(H<h || H<sh){
			$('#selector-body').css('overflow-y','scroll');
		}else{
			$('#selector-body').css('overflow','hidden');
		}
		//滚动距离  如果点击的是面包屑或者退出搜索，则滚动到上次记录的位置
		if(Global.isScrollToPreTop){
			$('#selector-body').scrollTop(Global.scrollTop);
		}else{
			$('#selector-body').scrollTop(0);
		}
		Global.isScrollToPreTop = false;
		//是否显示字母导航
		if(Global.isHasLetternav && $('.selector-person-nav').length){
			$('#selector-letter-nav').addClass('show');
			Global.isHasLetternav = false;
		}else{
			$('#selector-letter-nav').removeClass('show');
		}
	},

	//设置tab下拉列表是否可以滚动
	setTabListScroll: function(){
		if($('.selector-tab-content').length){
			var H = $('.selector-tab-content')[0].offsetHeight,
				h = $('.selector-tab-content ul')[0].offsetHeight;
			if(H < h){
				$('.selector-tab-content').css('overflow-y','scroll');
			}else{
				$('.selector-tab-content').css('overflow','hidden');
			}
		}	
	},

	//遍历已经选择的元素 或 不能选的元素
	eachChecked: function(){
		setTimeout(function(){
			var disabled = Global.paramValue.filter.disabled,
				disabledArr = disabled.contacts.concat(disabled.depts, disabled.titles),
				checked = Global.paramValue.filter.checked,
				contactsArr = checked.contacts,
				deptsArr = checked.depts,
				titlesArr = checked.titles,
				$item = $('.selector-search .photos .checkedCell'),
				checkedCellArr = [];
			
			$('.checkable .checkbox').removeClass('checked');

			//单选样式
			if(Global.paramValue.selectType == 1){
				$('.checkable .checkbox').addClass('radio');
			}
			
			//不显示的数据
			for(var i=0,lenI=disabledArr.length; i<lenI; i++){
				$('#selector-body .checkable[data-id="'+disabledArr[i]+'"]').addClass('checkunable').find('.checkbox').addClass('checked-unable');
			}

			//如果当前有不可用的数据 全选按钮不可用
			if($('#selector-body .checkunable').length && $('.selector-checkall').length){
				$('.selector-checkall').addClass('checkunable').find('.checkbox').addClass('checked-unable');
			}

			//第一次渲染遍历参数里的数据 及 选中的数据
			if(Global.isFirstRender){
				//默认已选择的数据  人员
				if(contactsArr.length){
					for(var x=0,lenX=contactsArr.length; x<lenX; x++){
						$('#selector-body .checkable[data-id="'+contactsArr[x]+'"]').find('.checkbox').addClass('checked');
						checkedCell = '<img class="checkedCell contacts" src="img/photo.png" data-id="'+contactsArr[x]+'">';
						checkedCellArr.push(checkedCell);
					}
				}
				//默认已选择的数据  部门
				if(deptsArr.length){
					for(var y=0,lenY=deptsArr.length; y<lenY; y++){
						$('#selector-body .checkable[data-id="'+deptsArr[y]+'"]').find('.checkbox').addClass('checked');
						checkedCell = '<span class="checkedCell depts" data-id="'+deptsArr[y]+'"></span>';
						checkedCellArr.push(checkedCell);
					}
				}
				//默认已选择的数据  职务
				if(titlesArr.length){
					for(var z=0,lenZ=titlesArr.length; z<lenZ; z++){
						$('#selector-body .checkable[data-id="'+titlesArr[z]+'"]').find('.checkbox').addClass('checked');
						checkedCell = '<span class="checkedCell titles" data-id="'+titlesArr[z]+'"></span>';
						checkedCellArr.push(checkedCell);
					}
				}
				//选中的头像展示
				if(contactsArr.length || deptsArr.length || titlesArr.length){
					$('.selector-search .photos .icon').remove();
					checkedCellArr = checkedCellArr.join('');
				    $('.selector-search .photos').append(checkedCellArr);
				    Selector.photosSet();
				    Selector.setRightButton();
				}
				//获取人员信息
				if(contactsArr.length){
					for(var j=0,lenJ=contactsArr.length; j<lenJ; j++){
						//如果顶部显示 则获取头像
						if($('#selector-top').is('.show')){
							FetchData.contactIcon({jid:contactsArr[j], isUpdate:0},function(data){
								var jid = data.rel.jid,
									src = 'data:image/jpg;base64,'+data.rel.base64;
								$('.selector-search .photos .checkedCell[data-id="'+jid+'"]').attr('src',src);
							});
						}
					}
					//获取人员信息
					FetchData.userInfo({jids:contactsArr,dataFlag:1},function(data){
						var contacts = data.rel.contacts;
						for(var i=0,len=contacts.length; i<len; i++){
							var jid = contacts[i].jid,
								name = contacts[i].name,
								titleId = contacts[i].titleId,
								titleName = contacts[i].titleName,
								deptId = contacts[i].deptId,
								deptName = contacts[i].deptName;
							if(!titleName || titleName=='undefined'){
								titleName = Language.unTitle;
							}
							$('.selector-search .photos .checkedCell[data-id="'+jid+'"]').attr({
								'data-name': name,
								'data-titleId': titleId,
								'data-titleName': titleName,
								'data-deptId': deptId,
								'data-deptName': deptName
							});
						}
					});
				}
			}else{
				//遍历选中的数据
			    for(var k=0,lenK=$item.length; k<lenK; k++){
			    	$('#selector-body .checkable[data-id="'+$item.eq(k).attr("data-id")+'"]').find('.checkbox').addClass('checked');
			    }
			}

			Global.isFirstRender = false;

		    //如果全部选择，则全选按钮选中
		    var allCheckableLen = $('.checkable').length,
		    	allCheckedLen = $('.checkable .checked').length;
		    if(allCheckableLen == allCheckedLen){
		    	$('.selector-checkall .checkbox').addClass('checked');
		    }
		},20);
	},

	//顶部头像滚动距离
	photosSet: function(){
	    var photos = $('#selector-top .photos'),
	    	imgs = $('#selector-top .photos img.checkedCell'),
	    	spans = $('#selector-top .photos span.checkedCell'),
	    	imgsLen = imgs.length || 0,
	    	spansLen = spans.length || 0,
	    	W = photos[0].offsetWidth,
	    	w, w1, w2;
		w1 = imgsLen ? (imgs[0].offsetWidth+8)*imgsLen : 0;
		w2 = spansLen ? (spans[0].offsetWidth+8)*spansLen : 0;
		w = w1 + w2;
	    if(w>W){
	    	photos.scrollLeft(w-W);
	    }
	},

	//单选样式  去掉全选按钮，并且内容上移
	singleStyle: function(){
		if(Global.paramValue.selectType == 1){
			$('.selector-checkall').remove();	//全选按钮移除
			$('.selector-mt').removeClass('selector-mt');	//全选按钮移除后，内容上移
		}
	},

	//人员更多信息
	moreInfoRender: function(jids){
		setTimeout(function(){
			//获取人员信息
			FetchData.userInfo({jids:jids,dataFlag:1},function(data){
				var contacts = data.rel.contacts;
				for(var i=0,len=contacts.length; i<len; i++){
					var jid = contacts[i].jid,
					name = contacts[i].name,
					titleId = contacts[i].titleId,
					titleName = contacts[i].titleName,
					deptId = contacts[i].deptId,
					deptName = contacts[i].deptName;
					if(!titleName || titleName=='undefined'){
						titleName = Language.unTitle;
					}
					$('#selector-body .checkable[data-id="'+jid+'"]').attr({
						'data-name': name,
						'data-titleId': titleId,
						'data-titleName': titleName,
						'data-deptId': deptId,
						'data-deptName': deptName
					}).find('.title').html(titleName);
				}
				
			});
		},0);
	},

	//获取头像 或更多信息
	getPhotos: function(){
		setTimeout(function(){
			var item,
				H = $('#selector-body')[0].offsetHeight + 400,
				scrollTop = $('#selector-body')[0].scrollTop,
				isLazy = false;		//人员信息是否分步加载
			//解决当搜索页显示时，主页面头像和职务全部加载的问题   ps:当元素隐藏后，offsetTop会变为0
			if($('#selector-search-main').css('display') == 'block'){
				item = $('#selector-search-main .selector-list .item');
			}else{
				item = $('#selector-main .selector-list .item');
			}
			//只有当不存在全选按钮或者全选不按钮可用时，随着滑动分步加载
			if(!$('.selector-checkall').length || $('.selector-checkall').is('.checkunable')){
				isLazy = true;
			}
			for(var i=0,len=item.length; i<len; i++){
				//只加载当前屏幕显示的头像和职务
				if(item[i].offsetTop-scrollTop>-60 && item[i].offsetTop-scrollTop<H && !item.eq(i).is('.loadPhotoOK')){
					var jid = item.eq(i).addClass('loadPhotoOK').attr('data-id');
					//获取头像
					FetchData.contactIcon({jid:jid, isUpdate:0},function(data){
						var jid = data.rel.jid,
							src = 'data:image/jpg;base64,'+data.rel.base64;
						$('#selector-body .checkable[data-id="'+jid+'"]').find('img').attr('src',src);
					});
					if(isLazy){
						//获取人员信息
						FetchData.userInfo({jids:[jid],dataFlag:1},function(data){
							var jid = data.rel.contacts[0].jid,
								name = data.rel.contacts[0].name,
								titleId = data.rel.contacts[0].titleId,
								titleName = data.rel.contacts[0].titleName,
								deptId = data.rel.contacts[0].deptId,
								deptName = data.rel.contacts[0].deptName;
							if(!titleName || titleName=='undefined'){
								titleName = Language.unTitle;
							}
							$('#selector-body .checkable[data-id="'+jid+'"]').attr({
								'data-name': name,
								'data-titleId': titleId,
								'data-titleName': titleName,
								'data-deptId': deptId,
								'data-deptName': deptName
							}).find('.title').html(titleName);
						});
					}
				}
			}
		},0);
	},

	//页面渲染初始化
	renderInit: function(){
		//多语言处理
		Selector.initLang();

		//显示搜索和tab切换
		$('#selector-top').addClass('show');
		$('#selector-header-out').addClass('show');

		//tab渲染
		if(Global.selector == 4){
			var renderTab1 = Mustache.render(Global.templateTab,Global.dataList);
			$('#selector-header').html(renderTab1).addClass('selector-header-rendered');
		}else{
			var renderTab2 = Mustache.render(Global.templateTab,Global.dataRoot);
			var renderTabList = Mustache.render(Global.templateTabList,Global.dataList);
			$('#selector-header').html(renderTab2).addClass('selector-header-rendered');
			$('#tab1000').append(renderTabList);
			var firstTabList = $('#tab1000 .selector-tab-content li');
			$('#tab1000').attr('data-id',firstTabList.eq(0).attr('data-id'));
			if(firstTabList.length == 1){
				$('#tab1000 .selector-tab-content').remove();
			}else{
				firstTabList.eq(0).addClass('checked');
				$('#tab1000').addClass('show');
				$('#tab1000 .selector-tab-head .kind em').html(' · '+firstTabList.eq(0).text());
			}
		}

		//tab初始化
		Selector.tabInit($('.selector-tab'));

		//渲染第一个tab 及 根导航条设置
		var firstTab = $('.selector-tab').eq(0);
		firstTab.addClass('show');
		Selector.crumbRootRender({id:firstTab.attr('data-id'), text:firstTab.find('.selector-tab-head .kind').text()});
		Selector.tabRender(firstTab.attr('data-id'));

		//设置内容区域是否可以滚动
		Selector.setScroll();

		//根tab是否可滚动
		if(Global.selector==4 && $('.selector-tab').length>4){
			$('#selector-header').addClass('scroll');
		}
	},

	//滚动页面调用的方法  加载头像和记录位置
	scrollFunc: function(){
		if($('#selector-header-out').css('display') == 'block'){
			var scrollTop = $('#selector-body')[0].scrollTop,
				$crumb = $('#selector-crumb .selector-crumb');
			if(!$crumb.find('span').length){
				$crumb.find('.root').attr({"data-top":scrollTop});
			}else{
				$crumb.find('span').last().attr({"data-top":scrollTop});
			}
		}
		Selector.getPhotos();
	}
};

//deviceready函数
function deviceReadyFunc() {
	//localStorage读取参数
	Selector.getItem(Global.paramId,function(data){
		Global.paramValue = data;
		//初始化参数
		Selector.paramsInit(data);
	});

	//点击面包屑root、path
	$('#selector-crumb').on('tap','.root',function(){
		$('#selector-header').css({'display':'block'});
		$('#selector-crumb').css('display','none').find('span').remove();
		//记录滚动的距离
		Global.scrollTop = $(this).attr("data-top");
		Global.isScrollToPreTop = true;
		//tab渲染
		Selector.tabRender(this.id);
	}).on('tap','.path',function(){
		$(this).removeClass('path');
		var thisIndex = $(this).index();
		while($('.selector-crumb span').length > thisIndex){
			$('.selector-crumb span').last().remove();
		}
		var params = JSON.parse($(this).attr('data').replace(/\^/g,'"'));
		//记录滚动的距离
		Global.scrollTop = $(this).attr("data-top");
		Global.isScrollToPreTop = true;
		Selector.departmentListRender(params,true);
	});

	//搜索
	$('#selector-top').on('tap','.input input',function(){ //点击输入框
		if($('#selector-main').css('display') !== 'none'){
			Global.scrollTop = $('#selector-body')[0].scrollTop;
		}
		$('.selector-search-off').css({'display':'block'});
		$('#selector-main').css({'display':'none'});
		$('#selector-header .selector-tab').removeClass('show-down');
		$('#selector-search-main').css({'display':'block'});
		$('#selector-header-out').removeClass('show');
		$('#selector-body-out').css({'top':'90px'});
		//隐藏字母导航
		$('#selector-letter-nav').removeClass('show');
	}).on('submit','.input form',function(){ //开始搜索
		var value = $.trim($(this).find('input').val());
		$(this).find('input').blur();
		if(value){
			FetchData.search({searchKey:value, filter:Global.selector, userTags:1},function(data){
				Selector.contactRender({data:data, renderType:'search'});
			});
		}
	}).on('tap','.selector-search-off',function(){ //关闭搜索
		// $('.selector-search').css({'opacity':0});
		// $('.selector-search-bg').css({'display':'block'});
		$('.selector-search-off').css({'display':'none'});
		$('#selector-main').css({'display':'block'});
		$('#selector-search-main').html('').css({'display':'none'});
		$('.selector-search .input input').val('').blur();
		$('#selector-body').scrollTop(0);
		$('#selector-header-out').addClass('show');
		$('#selector-body-out').css({'top':'100px'});
		if($('.selector-person-nav').length){
			Global.isHasLetternav = true;
		}
		Global.isScrollToPreTop = true;
		Selector.setScroll();
	}).on('tap','.photos .checkedCell',function(){ //头像删除
		var id = $(this).attr('data-id'),
			$checkable = $('#selector-body .checkable[data-id="'+id+'"]');		
		if($checkable.length){
			$checkable.find('.checkbox').removeClass('checked');
			$('.selector-checkall .checkbox').removeClass('checked');
		}		
		$(this).remove();
        Global.isEdit = true;
        Selector.setRightButton();
	});

	//内容交互
	$('#selector-body').on('tap','.checkable',function(){ //选择
		if($(this).is('.checkunable')){
			return;
		}
		var $that = $(this),
			$checkbox = $that.find('.checkbox'),
			checkedCell = '';
		if(Global.paramValue.selectType == 1){	//单选
			if($checkbox.is('.checked')){
		        return;
		    }
			$('.checked').removeClass('checked');
			$checkbox.addClass('checked');
			//头像添加
	        if($that.is('.selector-contacts-item')){
	        	checkedCell = '<img class="checkedCell contacts" src="'+$that.find('img')[0].src+'" data-id="'+$that.attr('data-id')+'" data-name="'+$that.attr('data-name')+'" data-titleId="'+$that.attr('data-titleId')+'" data-titleName="'+$that.attr('data-titleName')+'">';
	        }
	        if($that.is('.selector-depts-item')){
	        	checkedCell = '<span class="checkedCell depts" data-id="'+$that.attr('data-id')+'" data-name="'+$that.find('.name').text()+'">'+$that.find('.name').text()+'</span>';
	        }
	        if($that.is('.selector-titles-item')){
	        	checkedCell = '<span class="checkedCell titles" data-id="'+$that.attr('data-id')+'" data-name="'+$that.find('.name').text()+'">'+$that.find('.name').text()+'</span>';
	        }	        
	        $('.selector-search .photos').html(checkedCell);
	        Global.isEdit = true;
	        Selector.setRightButton();
		}else{		//多选
		    if($checkbox.is('.checked')){
		        $checkbox.removeClass('checked');
		        $('.selector-checkall .checkbox').removeClass('checked');
		        //头像删除		        
		        $('#selector-top .checkedCell[data-id="'+$that.attr('data-id')+'"]').remove();
		        Global.isEdit = true;
		        Selector.setRightButton();
		    }else{
		        $checkbox.addClass('checked');
		        //如果全部选择，则全选按钮选中
		        var allLen1 = $('.checkable .checked').length,
		        	allLen2 = $('.checkable').length;
		        if(allLen1 == allLen2){
		        	$('.selector-checkall .checkbox').addClass('checked');
		        }
		        //头像添加
		        $('.selector-search .photos .icon').remove();
		        if($that.is('.selector-contacts-item')){
		        	checkedCell = '<img class="checkedCell contacts" src="'+$that.find('img')[0].src+'" data-id="'+$that.attr('data-id')+'" data-name="'+$that.attr('data-name')+'" data-titleId="'+$that.attr('data-titleId')+'" data-titleName="'+$that.attr('data-titleName')+'">';
		        }
		        if($that.is('.selector-depts-item')){
		        	checkedCell = '<span class="checkedCell depts" data-id="'+$that.attr('data-id')+'" data-name="'+$that.find('.name').text()+'">'+$that.find('.name').text()+'</span>';
		        }
		        if($that.is('.selector-titles-item')){
		        	checkedCell = '<span class="checkedCell titles" data-id="'+$that.attr('data-id')+'" data-name="'+$that.find('.name').text()+'">'+$that.find('.name').text()+'</span>';
		        }	        
		        $('.selector-search .photos').append(checkedCell);
		        Selector.photosSet();
		        Global.isEdit = true;
		        Selector.setRightButton();
		    }
		}
	}).on('tap','.selector-checkall',function(){ //全选
		if($(this).is('.checkunable')){
			return;
		}
		var $that = $(this),
			$checkbox = $that.find('.checkbox'),
			item = null,
			i = 0,
			len = 0,
			checkedCell = '',
			checkedCellArr = [];
		if($checkbox.is('.checked')){
	        $checkbox.removeClass('checked');
	        $('.checkbox-list .checkbox').removeClass('checked');
	        //头像移除
	        item = $('.checkbox-list .checkable');
	        for(i=0,len=item.length; i<len; i++){
	        	$('#selector-top .checkedCell[data-id="'+item.eq(i).attr("data-id")+'"]').remove();
	        }
	        Global.isEdit = true;
	        Selector.setRightButton();
	    }else{
	        $checkbox.addClass('checked');
	        $('.checkbox-list .checkbox').addClass('checked');
	        $('.selector-search .photos .icon').remove();
			//头像添加
	        item = $('.checkbox-list .checkable');
	        if($that.is('.selector-checkall-depts')){
				for(i=0,len=item.length; i<len; i++){
		        	$('#selector-top .checkedCell[data-id="'+item.eq(i).attr("data-id")+'"]').remove();
		        	checkedCell = '<span class="checkedCell depts" data-id="'+item.eq(i).attr('data-id')+'" data-name="'+item.eq(i).find('.name').text()+'">'+item.eq(i).find('.name').text()+'</span>';
		        	checkedCellArr.push(checkedCell);
		        }
	        }else{
	        	for(i=0,len=item.length; i<len; i++){
		        	$('#selector-top .checkedCell[data-id="'+item.eq(i).attr("data-id")+'"]').remove();
		        	checkedCell = '<img class="checkedCell contacts" src="'+item.eq(i).find('img')[0].src+'" data-id="'+item.eq(i).attr('data-id')+'" data-name="'+item.eq(i).attr('data-name')+'" data-titleId="'+item.eq(i).attr('data-titleId')+'" data-titleName="'+item.eq(i).attr('data-titleName')+'">';
		        	checkedCellArr.push(checkedCell);
		        }
	        }		        
	        checkedCellArr = checkedCellArr.join('');
	        $('.selector-search .photos').append(checkedCellArr);
	        Selector.photosSet();
	        Global.isEdit = true;
	        Selector.setRightButton();
	    }
	}).on('scroll',function(){ //滚动内容 获取头像
		//函数节流
		Selector.throttle(Selector.scrollFunc,window);
	});
}

// $(function(){
// 	//deviceready事件 
// 	document.addEventListener("deviceready", deviceReadyFunc, false);	
// });

module.exports = deviceReadyFunc;


