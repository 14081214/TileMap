//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        _super.call(this);
        this.player = new Player();
        this.targetPos = new egret.Point();
        this.ifSearchWay = false;
        this.ifOnGoal = false;
        this.ifStartMoving = false;
        this.MoveTime = 0;
        this.movingTime = 32;
        this.gridSize = 64;
        this.thePath = 0;
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }
    var d = __define,c=Main,p=c.prototype;
    p.onAddToStage = function (event) {
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);
        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    };
    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    p.onConfigComplete = function (event) {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    };
    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    p.onResourceLoadComplete = function (event) {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    p.onItemLoadError = function (event) {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    p.onResourceLoadError = function (event) {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    };
    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    p.onResourceProgress = function (event) {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    };
    /**
     * 创建游戏场景
     * Create a game scene
     */
    p.createGameScene = function () {
        var _this = this;
        var stageW = this.stage.stageWidth;
        var stageH = this.stage.stageHeight;
        this.map = new TileMap();
        this.addChild(this.map);
        this.addChild(this.player.PlayerBitmap);
        this.player.PlayerBitmap.x = 64; //初始位置
        this.player.PlayerBitmap.y = 0;
        this.map.startTile = this.map.getTile(0, 0);
        this.map.endTile = this.map.getTile(0, 0);
        //this.map.setEndTile(2,1);
        this.astar = new AStar();
        //根据name关键字，异步获取一个json配置文件，name属性请参考resources/resource.json配置文件的内容。
        // Get asynchronously a json configuration file according to name keyword. As for the property of name please refer to the configuration file of resources/resource.json.
        //RES.getResAsync("description_json", this.startAnimation, this)
        this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, function (e) {
            _this.ifStartMoving = true;
            _this.playerx = Math.floor(_this.player.PlayerBitmap.x / _this.gridSize);
            _this.playery = Math.floor(_this.player.PlayerBitmap.y / _this.gridSize);
            _this.playerBitX = _this.player.PlayerBitmap.x;
            _this.playerBitY = _this.player.PlayerBitmap.y;
            _this.map.startTile = _this.map.getTile(_this.playerx, _this.playery);
            _this.thePath = 0;
            _this.targetPos.x = e.stageX;
            _this.targetPos.y = e.stageY;
            _this.tileX = Math.floor(_this.targetPos.x / _this.gridSize);
            _this.tileY = Math.floor(_this.targetPos.y / _this.gridSize);
            _this.map.endTile = _this.map.getTile(_this.tileX, _this.tileY);
            _this.ifSearchWay = _this.astar.findPath(_this.map);
            if (_this.ifSearchWay) {
                _this.player.SetState(new WalkingState(), _this);
                _this.thePath = 0;
            }
            if (_this.ifSearchWay)
                _this.map.startTile = _this.map.endTile;
        }, this);
        this.onMove();
        this.PlayerAnimation();
    };
    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    p.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    p.onMove = function () {
        var _this = this;
        var self = this;
        egret.Ticker.getInstance().register(function () {
            if (_this.ifStartMoving && self.ifSearchWay) {
                if (self.thePath < self.astar.pathArray.length - 1) {
                    var distanceX = self.astar.pathArray[self.thePath + 1].x - self.astar.pathArray[self.thePath].x;
                    var distanceY = self.astar.pathArray[self.thePath + 1].y - self.astar.pathArray[self.thePath].y;
                    if (distanceX > 0) {
                        self.player.SetRightOrLeftState(new GoRightState(), self);
                    }
                    if (distanceX <= 0) {
                        self.player.SetRightOrLeftState(new GoLeftState(), self);
                    }
                    if (!self.IfOnGoal(self.astar.pathArray[self.thePath + 1])) {
                        self.player.PlayerBitmap.x += distanceX / self.movingTime;
                        self.player.PlayerBitmap.y += distanceY / self.movingTime;
                    }
                    else {
                        self.thePath += 1;
                    }
                }
            }
            if (_this.ifStartMoving && !self.ifSearchWay) {
                var distanceX = self.map.startTile.x - self.playerBitX;
                var distanceY = self.map.startTile.y - self.playerBitY;
                if (distanceX > 0) {
                    self.player.SetRightOrLeftState(new GoRightState(), self);
                }
                if (distanceX <= 0) {
                    self.player.SetRightOrLeftState(new GoLeftState(), self);
                }
                if (!self.IfOnGoal(self.map.startTile)) {
                    self.player.PlayerBitmap.x += distanceX / self.movingTime;
                    self.player.PlayerBitmap.y += distanceY / self.movingTime;
                }
                else
                    self.player.SetState(new IdleState(), self);
            }
        }, self);
    };
    /* public playerMove(pic : egret.Bitmap):void{
         var self:any = this;
         var MapMove:Function = function (){
             egret.Tween.removeTweens(pic);
             var dis = self.player.PlayerBitmap.x - self.targetPos.x;
         if(self.player.GetIfGoRight() && pic.x >= - (pic.width - self.stage.stageWidth) ){
             egret.Tween.get(pic).to({x : pic.x - Math.abs(dis)},self.MoveTime);
         }
 
         if(self.player.GetIfGoLeft() && pic.x <= 0){
             egret.Tween.get(pic).to({x : pic.x + Math.abs(dis)},self.MoveTime);
         }
         }
         MapMove();
     }*/
    p.IfOnGoal = function (tile) {
        var self = this;
        if (self.player.PlayerBitmap.x == tile.x && self.player.PlayerBitmap.y == tile.y)
            this.ifOnGoal = true;
        else
            this.ifOnGoal = false;
        return this.ifOnGoal;
    };
    p.PlayerAnimation = function () {
        var self = this;
        var n = 0;
        var goIdle = 0;
        var goWalk = 0;
        var frame = 0;
        var standArr = ["jz1_png", "jz2_png", "jz3_png", "jz4_png"];
        var walkArr = ["tq1_png", "tq2_png", "tq3_png", "tq4_png"];
        var MoveAnimation = function () {
            //var playerBitmap = egret.Tween.get(self.player.PlayerBitmap);
            egret.Ticker.getInstance().register(function () {
                if (frame % 4 == 0) {
                    if (self.player.GetIfIdle() && !self.player.GetIfWalk()) {
                        goIdle = 0;
                        goWalk = 0;
                        //var textureName = standArr[n];
                        var texture = RES.getRes(standArr[n]);
                        self.player.PlayerBitmap.texture = texture;
                        n++;
                        if (n >= standArr.length) {
                            n = 0;
                        }
                    }
                    if (self.player.GetIfWalk() && self.player.GetIfGoRight() && !self.player.GetIfIdle()) {
                        n = 0;
                        goIdle = 0;
                        var textureName = walkArr[goWalk];
                        var texture = RES.getRes(textureName);
                        self.player.PlayerBitmap.texture = texture;
                        self.player.PlayerBitmap.scaleX = -1;
                        goWalk++;
                        if (goWalk >= walkArr.length) {
                            goWalk = 0;
                        }
                    }
                    if (self.player.GetIfWalk() && self.player.GetIfGoLeft() && !self.player.GetIfIdle()) {
                        n = 0;
                        goWalk = 0;
                        var textureName = walkArr[goIdle];
                        var texture = RES.getRes(textureName);
                        self.player.PlayerBitmap.texture = texture;
                        //self.player.PlayerBitmap.scaleX = 1;
                        goIdle++;
                        if (goIdle >= walkArr.length) {
                            goIdle = 0;
                        }
                    }
                }
                if (self.IfOnGoal(self.map.endTile)) {
                    self.player.SetState(new IdleState(), self);
                }
            }, self);
        };
        var FramePlus = function () {
            egret.Ticker.getInstance().register(function () {
                frame++;
                if (frame == 400)
                    frame = 0;
            }, self);
        };
        MoveAnimation();
        FramePlus();
    };
    return Main;
}(egret.DisplayObjectContainer));
egret.registerClass(Main,'Main');
var Player = (function () {
    function Player() {
        this.GoRight = false;
        this.GoLeft = false;
        this.MyPhoto = this.createBitmapByName("jz1_png");
        this.PlayerBitmap = new egret.Bitmap();
        this.PlayerBitmap.width = 64;
        this.PlayerBitmap.height = 64;
        this.PlayerBitmap.anchorOffsetX = this.MyPhoto.width / 2; //锚点
        this.PlayerBitmap.anchorOffsetY = this.MyPhoto.height / 2;
        this.ifIdle = true;
        this.ifWalk = false;
        this.IdleOrWalkStateMachine = new StateMachine();
        this.LeftOrRightStateMachine = new StateMachine();
    }
    var d = __define,c=Player,p=c.prototype;
    p.SetPlayerBitmap = function (picture) {
        this.PlayerBitmap = picture;
    };
    p.SetIdle = function (set) {
        this.ifIdle = set;
    };
    p.GetIfIdle = function () {
        return this.ifIdle;
    };
    p.SetWalk = function (set) {
        this.ifWalk = set;
    };
    p.GetIfWalk = function () {
        return this.ifWalk;
    };
    p.SetGoRight = function () {
        this.GoRight = true;
        this.GoLeft = false;
    };
    p.GetIfGoRight = function () {
        return this.GoRight;
    };
    p.SetGoLeft = function () {
        this.GoLeft = true;
        this.GoRight = false;
    };
    p.GetIfGoLeft = function () {
        return this.GoLeft;
    };
    p.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    p.SetState = function (e, _tmain) {
        this.IdleOrWalkStateMachine.setState(e, _tmain);
    };
    p.SetRightOrLeftState = function (e, _tmain) {
        this.LeftOrRightStateMachine.setState(e, _tmain);
    };
    return Player;
}());
egret.registerClass(Player,'Player');
var PeopleState = (function () {
    function PeopleState() {
    }
    var d = __define,c=PeopleState,p=c.prototype;
    p.OnState = function (_tmain) { };
    ;
    p.ExitState = function (_tmain) { };
    ;
    return PeopleState;
}());
egret.registerClass(PeopleState,'PeopleState',["State"]);
var StateMachine = (function () {
    function StateMachine() {
    }
    var d = __define,c=StateMachine,p=c.prototype;
    p.setState = function (e, _tmain) {
        if (this.CurrentState != null) {
            this.CurrentState.ExitState(_tmain);
        }
        this.CurrentState = e;
        this.CurrentState.OnState(_tmain);
    };
    return StateMachine;
}());
egret.registerClass(StateMachine,'StateMachine');
var IdleState = (function () {
    function IdleState() {
    }
    var d = __define,c=IdleState,p=c.prototype;
    p.OnState = function (_tmain) {
        _tmain.player.SetIdle(true);
        _tmain.player.SetWalk(false);
    };
    ;
    p.ExitState = function (_tmain) {
        _tmain.player.SetIdle(false);
    };
    ;
    return IdleState;
}());
egret.registerClass(IdleState,'IdleState');
var WalkingState = (function () {
    function WalkingState() {
    }
    var d = __define,c=WalkingState,p=c.prototype;
    p.OnState = function (_tmain) {
        _tmain.player.SetIdle(false);
        _tmain.player.SetWalk(true);
    };
    ;
    p.ExitState = function (_tmain) {
        _tmain.player.SetWalk(false);
    };
    ;
    return WalkingState;
}());
egret.registerClass(WalkingState,'WalkingState');
var GoRightState = (function () {
    function GoRightState() {
    }
    var d = __define,c=GoRightState,p=c.prototype;
    p.OnState = function (_tmain) {
        _tmain.player.SetGoRight();
    };
    ;
    p.ExitState = function (_tmain) { };
    ;
    return GoRightState;
}());
egret.registerClass(GoRightState,'GoRightState');
var GoLeftState = (function () {
    function GoLeftState() {
    }
    var d = __define,c=GoLeftState,p=c.prototype;
    p.OnState = function (_tmain) {
        _tmain.player.SetGoLeft();
    };
    ;
    p.ExitState = function (_tmain) { };
    ;
    return GoLeftState;
}());
egret.registerClass(GoLeftState,'GoLeftState');
//# sourceMappingURL=Main.js.map