const xml2js = require('xml2js');

class WxUtil{
    /**
     * json 2 xml
     * @param json
     * @returns {*}
     */
    static buildXML(json){
        let builder = new xml2js.Builder();

        return builder.buildObject(json);
    }

    /**
     * xml 2 xml string
     * @param xml
     * @param fn
     */
    static parseXML(xml,fn=function(err,result){}){
        let parser = new xml2js.Parser({
            trim:true,
            explicitArray:false,
            explicitRoot:false
        });

        parser.parseString(xml,fn);
    }

    /**
     *
     * @param stream
     * @param fn
     */
    static pipe(stream,fn){
        let buffers = [];
        //
        stream.on('data', function (trunk) {
            //
            buffers.push(trunk);
        });
        //
        stream.on('end', function () {
            //
            fn(null, Buffer.concat(buffers));
        });
        //
        stream.once('error', fn);
    }

    /**
     * random string
     * @param len
     * @returns {string}
     */
    static generateNonceString(len=32){
        let str='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let sl=str.length;
        let s='';
        for(let i=0;i<len;i++){
            s+=str[Math.floor(sl * Math.random())]
        }

        return s;
    }
}

module.exports=WxUtil;