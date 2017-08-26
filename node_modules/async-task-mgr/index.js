// async task manager
// Otto Mao (ottomao@gmail.com)

function asyncTaskMgr(){
    var self = this,
        TASK_ONGOING  = 0,
        TASK_COMPLETE = 1;
    self.callbackList = {};
    /* scheme sample 
    sampleName:{
        status:TASK_ERR,
        result:null,
        callbackList:[]
    }
    */

    self.addTask = function(name,action,cb){
        var task;
        if(task = self.callbackList[name]){
            if(task.status == TASK_COMPLETE){ //done
                cb && cb.apply(null,task.result);

            }else if(task.status == TASK_ONGOING){ //pending
                task.callbackList.push(cb);

            }
        }else{
            var task;
            task = self.callbackList[name] = {
                status : TASK_ONGOING,
                result : null,
                callbackList : [cb]
            };

            action && action.call(null,function(){
                task.result = arguments;
                task.status = TASK_COMPLETE;
                var tmpCb;
                while(tmpCb = task.callbackList.shift()){
                    tmpCb && tmpCb.apply(null,task.result);
                }
            });
        }
    }

    self.removeTask = function(name){
        delete self.callbackList[name];
    }
};

module.exports = asyncTaskMgr;
