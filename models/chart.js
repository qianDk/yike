var User = require("./userdb.js");
var userdb = require("./userdbserver.js");
var message = require("./messagesdb.js");
var messagedb = require('./messagedbserver.js');
var date = require('./date.js');

exports.findUser = function(req,res,id){
    var myid = req.session.userId;
    var myimgurl = req.session.imgurl;
    var id = {'_id':id};
    var out = {'name':1,'imgurl':1,'online':1};
    User.find(id, out, function(err, ress){
        if (err) {
            console.log("查询失败：" + err);
        }
        else {
            var context = {
            vacation : ress.map(function(ver){
                return {
                    id: ver._id,
                    name: ver.name,
                    imgurl: function(){
                        if(ver.imgurl){
                            return ver.imgurl;
                        }else{
                            return 'user.jpg';
                        }
                    },
                    online: ver.online,
                    myid: myid,
                    myimgurl: myimgurl,
                }
            })
        };
        res.render('chart',context);
        //res.redirect('/chart',context);
        }
    });
};

//获取数据库聊天数据
exports.showMessage = function(req,res,from,to){
    var search={
        $or : [ //多条件，数组
            {'fromUserID': from,'toUserID':to},
            {'fromUserID': to,'toUserID':from}
        ]
    };
    //var search = {'fromUserID': from,'toUserID': to};
    var out = {};
    message.find(search, out, function(err, rest){
        if (err) {
            console.log("查询失败：" + err);
        }
        else {
            var context = {
                vacation : rest.map(function(ver){
                    //将对应的信息标为已读
                    if(ver.status==0 && ver.toUserID==from){
                        messagedb.read(to,from);
                    }
                    var now = new Date();
                    if(now-ver.dateTime>1000*60*60*18){
                        var lasttime = date.DateDetail(ver.dateTime);
                    }else{
                        var lasttime = date.DateHouse(ver.dateTime);
                    }
                    return {
                        message: ver.postMessages,
                        status : ver.status,
                        fromUserID : ver.fromUserID,
                        toUserID: ver.toUserID,          
                        dateTime: lasttime, 
                        timeInt: ver.dateTime.getTime(),
                    }
                })
            };
            //console.log(context);
            res.send({success:true,context});
        }
    });

};
//获取数据库聊天数据
exports.showMessage1 = function(req,res,from,to,nowPage){
    var search={
        $or : [ //多条件，数组
            {'fromUserID': from,'toUserID':to},
            {'fromUserID': to,'toUserID':from}
        ]
    };
    var pageSize = 8;
    var skipnum = (nowPage - 1) * pageSize;   //跳过数
    //var search = {'fromUserID': from,'toUserID': to};
    var out = {};
    var query = message.find({});
    //根据userID查询
    query.where(search);
     //按照最后会话时间倒序排列
    query.sort({'dateTime':-1});
    //跳过数
    query.skip(skipnum);
    //一页多少条
    query.limit(pageSize);
    //查询结果
    query.exec().then(function(result){
        var context = {
                vacation : result.map(function(ver){
                    //将对应的信息标为已读
                    if(ver.status==0 && ver.toUserID==from){
                        messagedb.read(to,from);
                    }
                    var now = new Date();
                    if(now-ver.dateTime>1000*60*60*18){
                        var lasttime = date.DateDetail(ver.dateTime);
                    }else{
                        var lasttime = date.DateHouse(ver.dateTime);
                    }
                    return {
                        message: ver.postMessages,
                        status : ver.status,
                        fromUserID : ver.fromUserID,
                        toUserID: ver.toUserID,          
                        dateTime: lasttime, 
                        timeInt: ver.dateTime.getTime(),
                    }
                })
            };
            //console.log(context);
            res.send({success:true,context});
        }).catch(function(err){
        console.log(err);
    });  
};

//统计未读数
exports.getcount = function(res,userid,friendid){
    var wherestr = {'toUserID':userid,'fromUserID':friendid, 'status':0};
    
    message.countDocuments(wherestr, function(err, rest){
        if (err) {
            console.log("数据统计失败：" + err);
        }
        else {
            //console.log("数据统计成功！" + rest);
            res.send({success:true,rest:rest});
        }
    });
}

//查询符合条件的第一条数据
exports.findOne = function(res,userid,friendid){
    var query = message.findOne({});
    //根据userID查询
    //query.where({'toUserID':userid,'fromUserID':friendid});
    query.where({$or : [ //多条件，数组
            {'fromUserID': friendid,'toUserID':userid},
            {'fromUserID': userid,'toUserID':friendid}
        ]})
    query.sort({'dateTime':-1});
    //查询结果
    query.exec().then(function(result){
        res.send({success:true,result:result});
    }).catch(function(err){
        console.log(err);
    }); 
};