# koa-wxpay
 weixin pay for node koa

[![npm version](https://badge.fury.io/js/koa-wxpay.svg)](http://badge.fury.io/js/koa-wxpay)

## Installation
```
npm install koa-wxpay --save
```

## Usage

Thanks <a href="https://github.com/tvrcgo/weixin-pay" target="_blank">tvrcgo/weixin-pay</a>

to see

<a href="https://github.com/tvrcgo/weixin-pay" target="_blank">https://github.com/tvrcgo/weixin-pay</a>


## Add Other methods

//WxPay

#### static getClientIp(ctx)
#### static getServerHttp(ctx.req,page)
#### static success
#### static fail



```js
let WxPay = require('koa-wxpay');

let wxpay=new WxPay({
	appid: 'xxxxxxxx',
	mch_id: '',
	partner_key: '', //
	pfx: '', //
});

wxpay.createUnifiedOrder({
	body: '',
	out_trade_no: '',
	total_fee: 1,
	spbill_create_ip: WxPay.getClientIp(ctx),
	notify_url: WxPay.getServerHttp(opts.req,'/your/wxpay/notify'),
	trade_type: 'NATIVE',
	product_id: ''
}, function(err, result){
	console.log(result);
});
```

## Koa Handle

``` js
//KoaHandle
//create order
createUnifiedOrder(data={},opts={}){
    let wxpay=new WxPay(data);
    //
    return new Promise(function(resolve,reject){
        //
        //TODO
        //
        wxpay.createUnifiedOrder(data,function(err,result){
            if(err){
                //
                return reject(result);
            }
            //
            return resolve(result);
        });
    });
}
//change order status
changeUnifiedOrder(data={},opts={}){
    //TODO
}
```

## Koa Middleware Router

``` js
router.post('/xx/xx', async function(ctx,next){
    //
    //
    let handler = new KoaHandle();
    let res = await handler.createUnifiedOrder(data,opts).then(function(result){

        return result;
    }).catch(function(result){

        return result;
    });
    //
    ctx.body=res;
});

//
router.post('/your/wxpay/notify', async function(ctx,next){
    //
    //
    let handler = new KoaHandle();
    let res = await handler.changeUnifiedOrder(data,opts).then(function(result){
        //
        return WxPay.success();
    }).catch(function(result){
        //
        return WxPay.fail();
    });

    ctx.body=res;
})
```

## Other Notices
Only createUnifiedOrder method was verified ,other todo ... ,you can help me to test ^_^