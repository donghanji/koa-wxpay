const request = require('request');
const md5 = require('md5');
const fs = require('fs');

const WxUtil = require('./WxUtil');

const WxApiURL={
    'unifiedorder':'https://api.mch.weixin.qq.com/pay/unifiedorder',
    'orderquery':'https://api.mch.weixin.qq.com/pay/orderquery',
    'closeorder':'https://api.mch.weixin.qq.com/pay/closeorder',
    'refund':'https://api.mch.weixin.qq.com/secapi/pay/refund'
};

class WxPay{
    constructor(options={}){
        //
        if(options.pfx){
            try{

                options.pfx=fs.readFileSync(options.pfx);
            }catch(e){
                console.log('pfx path error',e.message);
            }
        }
        //
        this.options=options;
        this.wxpayID={
            appid:options.appid,
            mch_id:options.mch_id||''
        }
    }

    /**
     *
     * @param param
     */
    sign(param){
        //
        let querystring = Object.keys(param).filter(function(key){

            return param[key] !== undefined && param[key] !== '' && ['pfx', 'partner_key', 'sign', 'key'].indexOf(key) < 0;
        }).sort().map(function(key){

            return key + '=' + param[key];
        }).join('&') + '&key=' + this.options.partner_key;

        return md5(querystring).toUpperCase();
    }

    /**
     *
     * @param opts
     * @param fn
     */
    createUnifiedOrder(opts,fn){
        //
        opts.nonce_str = opts.nonce_str || WxUtil.generateNonceString();
        //
        Object.assign(Object,this.wxpayID);
        //
        opts.sign = this.sign(opts);

        //console.log('createUnifiedOrder params:',opts,this.wxpayID);
        //
        request({
            url: WxApiURL.unifiedorder,
            method: 'POST',
            body: WxUtil.buildXML(opts),
            agentOptions: {
                pfx: this.options.pfx||'',
                passphrase: this.options.mch_id
            }
        }, function(err, response, body){
            //
            WxUtil.parseXML(body, fn);
        });
    }

    /**
     *
     * @param order
     * @param fn
     */
    getBrandWCPayRequestParams(order,fn){
        //
        let self = this;
        //
        order.trade_type = 'JSAPI';
        //
        this.createUnifiedOrder(order, function(err, data){
            //console.log('getBrandWCPayRequestParams result:',err,data);
            if(!data.prepay_id || data.return_code === 'FAIL'){

                return fn('FAIL',data.return_msg);
            }
            let params = {
                appId: self.options.appid,
                timeStamp: Math.floor(Date.now()/1000)+'',
                nonceStr: data.nonce_str,
                package: 'prepay_id='+data.prepay_id,
                signType: 'MD5'
            };
            //
            params.paySign = self.sign(params);
            //
            fn(err, params);
        });
    }

    /**
     *
     * @param param
     * @returns {string}
     */
    createMerchantPrepayUrl(param){
        //
        param.time_stamp = param.time_stamp || Math.floor(Date.now()/1000);
        param.nonce_str = param.nonce_str || WxUtil.generateNonceString();
        //
        Object.assign(param,this.wxpayID);
        //
        param.sign = this.sign(param);

        var query = Object.keys(param).filter(function(key){
            //
            return ['sign', 'mch_id', 'product_id', 'appid', 'time_stamp', 'nonce_str'].indexOf(key) >= 0;
        }).map(function(key){
            //
            return key + '=' + encodeURIComponent(param[key]);
        }).join('&');

        return 'weixin://wxpay/bizpayurl?' + query;
    }

    /**
     *
     * @param query
     * @param fn
     */
    queryOrder(query,fn){
        //
        if (!(query.transaction_id || query.out_trade_no)) {
            //

            return fn(null,{
                return_code: 'FAIL',
                return_msg:'缺少参数'
            });
        }
        //
        query.nonce_str = query.nonce_str || WxUtil.generateNonceString();
        Object.assign(query, this.wxpayID);
        //
        query.sign = this.sign(query);
        //
        request({
            url: WxApiURL.orderquery,
            method: 'POST',
            body: WxUtil.buildXML({xml: query})
        }, function(err, res, body){
            //
            WxUtil.parseXML(body, fn);
        });
    }

    /**
     *
     * @param order
     * @param fn
     */
    closeOrder(order, fn){
        //
        if (!order.out_trade_no) {
            //
            return fn(null, {
                return_code:'FAIL',
                return_msg:'缺少参数'
            });
        }
        //
        order.nonce_str = order.nonce_str || WxUtil.generateNonceString();
        Object.assign(order, this.wxpayID);
        //
        order.sign = this.sign(order);
        //
        request({
            url: WxApiURL.closeorder,
            method: 'POST',
            body: WxUtil.buildXML({xml:order})
        }, function(err, res, body){
            //
            WxUtil.parseXML(body, fn);
        });
    }

    /**
     *
     * @param order
     * @param fn
     * @returns {*}
     */
    refund(order, fn){
        //
        if (!(order.transaction_id || order.out_refund_no)) {
            //
            return fn(null, {
                return_code: 'FAIL',
                return_msg:'缺少参数'
            });
        }
        //
        order.nonce_str = order.nonce_str || WxUtil.generateNonceString();
        Object.assign(order, this.wxpayID);
        //
        order.sign = this.sign(order);
        //
        request({
            url: WxApiURL.refund,
            method: 'POST',
            body: WxUtil.buildXML({xml: order}),
            agentOptions: {
                pfx: this.options.pfx,
                passphrase: this.options.mch_id
            }
        }, function(err, response, body){
            //
            WxUtil.parseXML(body, fn);
        });
    }
    /**
     * get client ip
     * @param req
     * @returns {string|*}
     */
    static getClientIp(ctx) {
        let req=ctx.request||ctx;
        //
        if(!req){

            return '';
        }
        //console.log('req.connection:',req.connection,req.ip);
        let ip=req.headers['x-forwarded-for'] ||
            (req.connection && req.connection.remoteAddress) || req.ip || '';
        //
        ip=ip.match(/\d+\.\d+\.\d+\.\d+/);
        //
        return ip;
    }

    /**
     * get server http
     * @param ctx
     * @param page
     * @returns {string}
     */
    static getServerHttp(ctx,page){
        //
        if(!ctx){

            return '';
        }
        //
        let res=[ctx.protocol,'://',ctx.headers.host];
        //
        if(page){
            //
            res.push(page);
        }
        //
        return res.join('');
    }
    /**
     *
     * @param fn
     * @returns {Function}
     */
    static useWXCallback(req) {
        //
        return new Promise(function (resolve) {
            //
            WxUtil.pipe(req, function (err, data) {
                //
                var xml = data.toString('utf8');
                //
                WxUtil.parseXML(xml, function (err, msg) {
                    //
                    req.wxmessage = msg;
                    //
                    resolve(msg);
                });
            });
        });
    }

    /**
     *
     * @returns {*}
     */
    static success(){
        //
        return WxUtil.buildXML({
            xml:{
                return_code:'SUCCESS'
            }
        })
    }

    /**
     *
     * @returns {*}
     */
    static fail(){
        //
        return WxUtil.buildXML({
            xml:{
                return_code:'FAIL'
            }
        })
    }
}

module.exports=WxPay;