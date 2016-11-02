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

class Main extends egret.DisplayObjectContainer {

    /**
     * 加载进度界面
     * Process interface loading
     */
    private loadingView:LoadingUI;

    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }

    private onAddToStage(event:egret.Event) {
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);

        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    }

    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    private onConfigComplete(event:RES.ResourceEvent):void {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    }

    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    private onResourceLoadComplete(event:RES.ResourceEvent):void {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onItemLoadError(event:RES.ResourceEvent):void {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onResourceLoadError(event:RES.ResourceEvent):void {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    }

    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    private onResourceProgress(event:RES.ResourceEvent):void {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    }

    public player : Player = new Player();
    private targetPos : egret.Point = new egret.Point();
    
    private map : TileMap;
    private astar : AStar;

    private ifSearchWay = false;
    private ifOnGoal = false;
    private ifStartMoving = false;
    private playerx : number;
    private playery : number;
    private tileX : number;
    private tileY : number;
    private playerBitX : number;
    private playerBitY : number;
    private MoveTime = 0;
    private movingTime = 32;
    private gridSize = 64;
    private thePath = 0;
    
    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameScene():void {
        var stageW:number = this.stage.stageWidth;
        var stageH:number = this.stage.stageHeight;

        this.map = new TileMap();
        this.addChild(this.map);

         this.addChild(this.player.PlayerBitmap);
         this.player.PlayerBitmap.x = 64;            //初始位置
         this.player.PlayerBitmap.y = 0;

         this.map.startTile = this.map.getTile(0,0);
         this.map.endTile = this.map.getTile(0,0);
         //this.map.setEndTile(2,1);

         this.astar = new AStar();


       

        //根据name关键字，异步获取一个json配置文件，name属性请参考resources/resource.json配置文件的内容。
        // Get asynchronously a json configuration file according to name keyword. As for the property of name please refer to the configuration file of resources/resource.json.
        //RES.getResAsync("description_json", this.startAnimation, this)
            this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN,(e : egret.TouchEvent)=>{
                this.ifStartMoving = true;

                this.playerx = Math.floor(this.player.PlayerBitmap.x / this.gridSize);
                this.playery = Math.floor(this.player.PlayerBitmap.y / this.gridSize);
                this.playerBitX = this.player.PlayerBitmap.x;
                this.playerBitY = this.player.PlayerBitmap.y;
                this.map.startTile = this.map.getTile(this.playerx,this.playery);
                this.thePath = 0;

                this.targetPos.x = e.stageX;
                this.targetPos.y = e.stageY;
                this.tileX = Math.floor(this.targetPos.x / this.gridSize);
                this.tileY = Math.floor(this.targetPos.y / this.gridSize);

                this.map.endTile = this.map.getTile(this.tileX,this.tileY);
                this.ifSearchWay = this.astar.findPath(this.map);
                if(this.ifSearchWay){
                    this.player.SetState(new WalkingState(),this);
                    this.thePath = 0;
                }

                if(this.ifSearchWay)
                this.map.startTile = this.map.endTile;
            },this)
      
            this.onMove();
            this.PlayerAnimation();
         
    }

    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    private createBitmapByName(name:string):egret.Bitmap {
        var result = new egret.Bitmap();
        var texture:egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }


   public onMove(){
       var self:any = this;
       
       egret.Ticker.getInstance().register(()=>{
    if(this.ifStartMoving && self.ifSearchWay){
       if(self.thePath < self.astar.pathArray.length - 1){ 
            var distanceX = self.astar.pathArray[self.thePath + 1].x - self.astar.pathArray[self.thePath].x;
            var distanceY = self.astar.pathArray[self.thePath + 1].y - self.astar.pathArray[self.thePath].y;
            //console.log(distanceX + "And" + distanceY);

            if(distanceX > 0){
            self.player.SetRightOrLeftState(new GoRightState(),self);
            }
            if(distanceX <= 0){
            self.player.SetRightOrLeftState(new GoLeftState(),self);
            }
            if(!self.IfOnGoal(self.astar.pathArray[self.thePath + 1])){
               self.player.PlayerBitmap.x += distanceX / self.movingTime;
               self.player.PlayerBitmap.y += distanceY / self.movingTime;
            }
            else{
               self.thePath += 1;
            }
          }
    }
    if(this.ifStartMoving && !self.ifSearchWay){
        var distanceX = self.map.startTile.x - self.playerBitX;
        var distanceY = self.map.startTile.y - self.playerBitY;
        if(distanceX > 0){
            self.player.SetRightOrLeftState(new GoRightState(),self);
            }
            if(distanceX <= 0){
            self.player.SetRightOrLeftState(new GoLeftState(),self);
            }
        if(!self.IfOnGoal(self.map.startTile)){
               self.player.PlayerBitmap.x += distanceX / self.movingTime;
               self.player.PlayerBitmap.y += distanceY / self.movingTime;
            }
            else
            self.player.SetState(new IdleState(),self);
    }
        },self)
      
   }



    public PictureMove(pic : egret.Bitmap):void{
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
    }


    public IfOnGoal(tile : Tile) : any{
        var self:any = this;
        if(self.player.PlayerBitmap.x == tile.x && self.player.PlayerBitmap.y == tile.y)
        this.ifOnGoal = true;
        else 
        this.ifOnGoal = false;
        return this.ifOnGoal;

    }


    public PlayerAnimation():void{
        var self:any = this;
        var n = 0;
        var goIdle = 0;
        var goWalk = 0;
        var zhen = 0;
        var standArr = ["jz1_png","jz2_png","jz3_png","jz4_png"];
        var walkArr = ["tq1_png","tq2_png","tq3_png","tq4_png"];

        var MoveAnimation:Function = function (){
            //var playerBitmap = egret.Tween.get(self.player.PlayerBitmap);
               
                
                egret.Ticker.getInstance().register(()=>{
                if(zhen % 4 == 0){
                    if(self.player.GetIfIdle() && !self.player.GetIfWalk()){
                        goIdle = 0;
                        goWalk = 0;
                        //var textureName = standArr[n];
                        var texture : egret.Texture = RES.getRes(standArr[n]);
                        self.player.PlayerBitmap.texture = texture;
                        n++;
                        if(n >= standArr.length){
                          n=0;
                        }
                    }

                    if(self.player.GetIfWalk() && self.player.GetIfGoRight() && !self.player.GetIfIdle()){
                        n = 0;
                        goIdle = 0;
                    var textureName = walkArr[goWalk];
                    var texture : egret.Texture = RES.getRes(textureName);
                    self.player.PlayerBitmap.texture = texture;
                    self.player.PlayerBitmap.scaleX = -1;
                    goWalk++;
                    if(goWalk >= walkArr.length){
                          goWalk=0;
                        }
                    }
                    if(self.player.GetIfWalk() && self.player.GetIfGoLeft() && !self.player.GetIfIdle()){
                        n = 0;
                        goWalk = 0;
                    var textureName = walkArr[goIdle];
                    var texture : egret.Texture = RES.getRes(textureName);
                    self.player.PlayerBitmap.texture = texture;
                    self.player.PlayerBitmap.scaleX = 1;
                    goIdle++;
                    if(goIdle >= walkArr.length){
                          goIdle=0;
                        }
                    }
                }
                    if(self.IfOnGoal(self.map.endTile)){
                     self.player.SetState(new IdleState(),self);
                    }
                },self);
        }

        var FramePlus : Function = function(){
            egret.Ticker.getInstance().register(()=>{
            zhen++;
            if(zhen == 400)
            zhen = 0;
            },self)
        }
        MoveAnimation();
        
        FramePlus();
    }

}


class Player{
    public PlayerBitmap : egret.Bitmap;
    private ifIdle : boolean;
    private ifWalk : boolean;
    private GoRight : boolean = false;
    private GoLeft : boolean = false;
    private IdleOrWalkStateMachine : StateMachine;
    private LeftOrRightStateMachine : StateMachine;

    constructor(){
        this.PlayerBitmap = new egret.Bitmap();
        this.PlayerBitmap.width = 49;
        this.PlayerBitmap.height = 64;
        // this.PlayerBitmap.anchorOffsetX = 2 * this.PlayerBitmap.width / 3;
        // this.PlayerBitmap.anchorOffsetY = this.PlayerBitmap.height;
        this.ifIdle = true;
        this.ifWalk = false;
        this.IdleOrWalkStateMachine = new StateMachine();
        this.LeftOrRightStateMachine = new StateMachine();

    }

    public SetPlayerBitmap(picture:egret.Bitmap){
        this.PlayerBitmap = picture;
    }


    public SetIdle(set : boolean){
        this.ifIdle = set;
    }

    public GetIfIdle(): boolean{
        return this.ifIdle;
    }

    public SetWalk(set : boolean){
        this.ifWalk = set;
    }

    public GetIfWalk(): boolean{
        return this.ifWalk
    }

    public SetGoRight(){
        this.GoRight = true;
        this.GoLeft = false;
    }

    public GetIfGoRight(): boolean{
        return this.GoRight;
    }

    public SetGoLeft(){
        this.GoLeft = true;
        this.GoRight = false;
    }

    public GetIfGoLeft() : boolean{
        return this.GoLeft;
    }

    private createBitmapByName(name:string):egret.Bitmap {
        var result = new egret.Bitmap();
        var texture:egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }

    public SetState(e : State , _tmain : Main){
        this.IdleOrWalkStateMachine.setState(e,_tmain);
    }

    public SetRightOrLeftState(e : State , _tmain : Main){
        this.LeftOrRightStateMachine.setState(e,_tmain);
    }


}

interface State{
    OnState(_tmain : Main);

    ExitState(_tmain : Main);

}

class PeopleState implements State{
      OnState(_tmain : Main){};

      ExitState(_tmain : Main){};
}

class StateMachine{
     CurrentState : State;

     setState( e : State , _tmain : Main){
        if( this.CurrentState != null){
           this.CurrentState.ExitState(_tmain);
        }
        this.CurrentState = e;
        this.CurrentState.OnState(_tmain);
     }
}


class IdleState implements PeopleState{

    OnState(_tmain : Main){
        _tmain.player.SetIdle(true);
        _tmain.player.SetWalk(false);
    };

    ExitState(_tmain : Main){
        _tmain.player.SetIdle(false);
    };

}

class WalkingState implements PeopleState{
      OnState(_tmain : Main){
        _tmain.player.SetIdle(false);
        _tmain.player.SetWalk(true);
    };

    ExitState(_tmain : Main){
        _tmain.player.SetWalk(false);
    };
}

class GoRightState implements PeopleState{
    OnState(_tmain : Main){
        _tmain.player.SetGoRight();
    };

    ExitState(_tmain : Main){};

}

class GoLeftState implements PeopleState{
    OnState(_tmain : Main){
        _tmain.player.SetGoLeft();
    };

    ExitState(_tmain : Main){};

}
