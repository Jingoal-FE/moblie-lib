/**
 * @file listener.js
 * @author deo
 *
 * 事件基类
 */

/**
 * 虚拟Event
 *
 * @param {string} type 事件类型
 * @constructor
 */
function Event(type) {

    /**
     * 事件类型
     *
     * @type {string}
     */
    this.type = type;

    /**
     * 参数
     * @type {*}
     */
    this.args;


    /**
     * 上一个事件的返回值
     *
     * @type {*}
     */
    this.returns;

    /**
     * 判断是否阻止默认事件
     *
     * @type {boolean}
     */
    this.isDefaultPrevented = false;

    /**
     * 判断此事件是否被停止蔓延
     *
     * @type {boolean}
     */
    this.isPropagationStopped = false;
}

Event.prototype = {

    /**
     * 阻止事件默认行为
     */
    preventDefault: function () {
        this.isDefaultPrevented = true;
    },

    /**
     * 阻止事件蔓延
     */
    stopPropagation: function () {
        this.isPropagationStopped = true;
    }
};

module.exports = {

    /**
     * 绑定事件
     *
     * @param {string} type 事件名
     * @param {Function} listener 事件处理器
     * @param {Object} context 事件处理器的上下文。
     */
    on: function (type, listener, context) {
        if ($.isFunction(type)) {
            listener = type;
            type = '*';
        }

        context = context || this;

        this._listeners = this._listeners || {};
        var listeners = this._listeners[type] || [];

        if ($.inArray(listener, listeners) < 0) {
            listener.$type = type;
            listener.$context = context;
            listeners.push(listener);
        }

        this._listeners[type] = listeners;
    },

    /**
     * 解除事件绑定
     *
     * @public
     * @param {string=} type 事件类型
     * @param {Function=} listener 要解除绑定的监听器
     */
    off: function (type, listener) {
        if ($.isFunction(type)) {
            listener = type;
            type = '*';
        }

        this._listeners = this._listeners || {};
        var listeners = this._listeners[type];

        if (listeners) {
            if (listener) {
                var index = $.inArray(listener, listeners);

                if (~index) {
                    delete listeners[index];
                }
            }
            else {
                listeners.length = 0;
                delete this._listeners[type];
            }
        }

    },

    /**
     * 添加单次事件绑定
     *
     * @public
     * @param {string=} type 事件类型
     * @param {Function} listener 要添加绑定的监听器
     */
    once: function (type, listener) {
        if ($.isFunction(type)) {
            listener = type;
            type = '*';
        }

        var me = this;
        var realListener = function () {
            listener.apply(me, arguments);
            me.un(type, realListener);
        };
        this.on.call(me, type, realListener);
    },

    /**
     * 触发指定事件
     *
     * @public
     * @param {string|Event} event 事件类型或者事件本身
     *
     * @return {Event} 生成的事件
     */
    fire: function (event) {
        if ($.type(event) === 'string') {
            event = new Event(event);
        }

        var args = [].slice.call(arguments, 1);
        args.unshift(event);
        event.args = args;

        this._listeners = this._listeners || {};

        var listeners = this._listeners[event.type] || [];
        var wildcardListeners = this._listeners['*'];

        // 把listeners和wildcardListeners合并
        if (wildcardListeners) {
            var me = this;
            $.each(wildcardListeners, function (index, event) {
                if ($.inArray(event, me.events) < 0) {
                    listeners.push(event);
                }
            });
        }

        var length = listeners.length;
        var i = -1;
        var fn;
        var params = args;
        var returns;
        while (++i < length) {
            if (event.isPropagationStopped
                || false === (returns = event.returns = (fn = listeners[i]).apply(fn.$context, params))
            ) {
                event.stopPropagation();
                event.preventDefault();
            }
            else {
                if (returns !== undefined) {
                    // 如果返回是undefined，则使用原始的args，否则使用上一个listener的返回值作为参数
                    params = [event, returns];
                }
            }
        }

        return event;
    },

    Event: Event
};
