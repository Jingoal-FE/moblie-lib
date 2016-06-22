/**
 * @file control.js
 * @author deo
 *
 * 所有组件类的父级
 */

var ERR_MSG = {
    NOT_IMPLEMENTED: 'not implement method',
    NOT_RENDERED: 'You should render Control first'
};

var listener = require('./listener');
var util = require('./util');
var view = require('./view');

/**
 * Control
 *
 * @param {Object} opts 配置项
 * @param {HTMLElement} opts.main 该控件的根元素
 * @param {HTMLElement} opts.wrapper 根元素的parentNode
 * @param {string} opts.tpl 模板
 * @param {Object} opts.data 数据
 * @constructor
 */
function Control(opts) {

    /**
     * 配置项
     *
     * @type {*|{}}
     */
    this.opts = opts || {};
    /**
     * 控件ID
     * @type {string}
     */
    this.uuid = util.guid();

    /**
     * 控件名称
     *
     * @type {string}
     */
    this.name = 'Control';

    /**
     * 控件状态
     *
     * @type {boolean}
     * @private
     */
    this._disabled = false;

    /**
     * 控件的子控件
     *
     * @type {Array}
     */
    this.children = {};

    /**
     * 该控件的Root DOM节点
     *
     * @type {HTMLElement|Array<HTMLElement>}
     */
    this.main = this.opts.main;

    /**
     * 该控件的parentNode
     *
     * @type {HTMLElement}
     */
    this.wrapper = this.opts.wrapper;

    /**
     * 控件渲染后的HTML
     *
     * @type {string}
     */
    this.html;

    /**
     * 模板
     *
     * @type {string|*|string}
     */
    this.tpl = this.opts.tpl || '';

    /**
     * 错误模板
     *
     * @type {string|*|string}
     */
    this.errTpl = this.opts.errTpl || '';

    /**
     * 控件暴露的事件
     *
     * @type {string}
     * @private
     */
    this._events = [
        'render', 'bindEvents', 'dispose', 'disposeEvents', 'disposeDoms',
        'appendTo', 'disable', 'enable', 'addChild', 'removeChild'
    ];

    /**
     * 可被子类改变的events
     * @type {Array}
     */
    this.events = [];

    /**
     * initialized
     *
     * @type {boolean}
     */
    this.inited = false;

    /**
     * listeners
     *
     * @type {Object}
     */
    this._listeners = {};

}

$.extend(Control.prototype, listener);

/**
 * 执行控件的初始化
 *
 * @protected
 */
Control.prototype._init = function () {
    var me = this;
    if (me.inited) {
        return;
    }

    // 把me._events和me.events合并
    $.each(me._events, function (index, event) {
        if ($.inArray(event, me.events) < 0) {
            me.events.push(event);
        }
    });

    me.events.forEach(function (event) {
        var suffix = event.charAt(0).toUpperCase() + event.substring(1);
        var before = 'before' + suffix;
        var after = 'after' + suffix;
        var name = '__' + event;

        // 赋值给另外一个变量
        me[name] = me[event];
        me[event] = function () {
            var args = Array.prototype.slice.call(arguments, 0);
            args.unshift(before);

            var event = me.fire.apply(me, args);

            // 如果事件被停止，则不继续往下走
            if (!event.isDefaultPrevented && !event.isPropagationStopped) {
                // 如果之前的事件有返回值，则使用返回值作为参数，否则使用原始的
                if (event.returns !== undefined) {
                    args = event.returns;
                }
                else {
                    args = args.slice(1);
                }
                // 如果函数返回false，则停止事件，否则调用after
                var returns = me[name].apply(me, args);
                if (false === returns) {
                    event.stopPropagation();
                }
                else {
                    // 如果fn有返回值，则作为after的参数，否则使用原始参数
                    if (returns !== undefined) {
                        args = [null, returns];
                    }
                    args[0] = after;
                    me.fire.apply(me, args);
                }
            }
            else {
                return false;
            }
        };
    });

    me.init();
    me.inited = true;
};

Control.prototype.init = function () {};

/**
 * 渲染控件, 如果要调用该方法，请务必给 Control 传递 tpl
 *
 * @param {Object} data 渲染所需数据
 * @param {string} type 添加方式
 * @return {string}
 */
Control.prototype.render = function (data, type) {

    var selector = $(this.opts.wrapper);
    var options = {
        tmpl: this.opts.tpl,
        partials: this.opts.partials,
        type: type || 'html'
    };

    return view.render(selector, data, options);
};

/**
 * 失败渲染控件
 *
 * @param {Object} data 渲染所需数据
 * @return {string}
 */
Control.prototype.error = function (data) {

    var selector = $(this.opts.wrapper);
    var options = {
        tmpl: this.opts.errTpl,
        type: 'html'
    };

    return view.render(selector, data, options);
};

/**
 * Bind events, need to be rewritten
 */
Control.prototype.bindEvents = function () {};

/**
 * 重新渲染
 */
Control.prototype.rerender = function () {
    throw new Error(ERR_MSG.NOT_IMPLEMENTED);
};

/**
 * dispose
 */
Control.prototype.dispose = function () {
    this.disposeEvents();
    this.disposeDoms();
};

/**
 * 销毁事件
 */
Control.prototype.disposeEvents = function () {

    for (var uuid in this.children) {
        if (this.children.hasOwnProperty(uuid)) {
            this.children[uuid].disposeEvents();
        }
    }

    for (var type in this._listeners) {
        if (this._listeners.hasOwnProperty(type)) {
            this.off(type);
        }
    }
};

/**
 * 销毁DOM
 */
Control.prototype.disposeDoms = function () {
    for (var uuid in this.children) {
        if (this.children.hasOwnProperty(uuid)) {
            this.children[uuid].disposeDoms();
        }
    }

    var main = this.main;
    if (main) {
        var nodes = $.isArray(main) ? main : [main];
        var parentNode = nodes[0].parentNode;
        nodes.forEach(function (node) {
            parentNode.removeChild(node);
        });
        this.main = null;
    }
};

/**
 * 将控件添加到页面的某个元素中
 *
 * @param {HTMLElement} wrapper 被添加到的页面元素
 */
Control.prototype.appendTo = function (wrapper) {
    if (!this.main) {
        throw new Error(ERR_MSG.NOT_RENDERED);
    }
    // TODO (by pengxing) 考虑是否需要先移除再append到新的节点
    wrapper.appendChild(this.main);

    this.wrapper = wrapper;
};

/**
 * disable 控件
 */
Control.prototype.disable = function () {
    this._disabled = true;
};

/**
 * enable 控件
 */
Control.prototype.enable = function () {
    this._disabled = false;
};

/**
 * 获取控件可用状态
 *
 * @return {boolean} 控件的可用状态值
 * @public
 */
Control.prototype.isDisabled = function () {
    return this._disabled;
};

/**
 * 添加子控件
 *
 * @param {Control} control 控件实例
 * @public
 */
Control.prototype.addChild = function (control) {
    var children = this.children;

    var uuid = control.uuid;

    if (children[uuid]) {
        children[uuid] = control;
    }
    else {
        children[control.uuid] = control;
    }

};

/**
 * 删除子控件
 *
 * @param {Control} control 控件实例
 * @public
 */
Control.prototype.removeChild = function (control) {
    delete this.children[control.uuid];
};

/**
 * 根据uuid获取子控件
 *
 * @param {string} uuid uuid
 * @return {Control}
 */
Control.prototype.getChild = function (uuid) {
    return this.children[uuid];
};

/**
 * 根据控件名称获取控件集合
 *
 * @param {string} name 控件名称
 * @return {Array<Control>}
 */
Control.prototype.getChildrenByName = function (name) {
    var children = {};
    var res = [];
    var child;
    for (var uuid in children) {
        if (children.hasOwnProperty(uuid)) {
            child = children[uuid];

            if (child.name === name) {
                res.push(child);
            }
        }
    }

    return res;
};

module.exports = Control;
