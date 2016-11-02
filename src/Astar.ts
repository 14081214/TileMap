class AStar{
    private openList : Tile[];
    private closeList : Tile[];
    private tileMap : TileMap;
    public startTile : Tile;
    public endTile : Tile;
    public pathArray : Tile[];
    private straightCost:number = 1.0;
    private diagCost:number = Math.SQRT2;
    private heuristic:Function = this.diagonal;
    constructor(){};

    public findPath(tileMap : TileMap):any{
          var h = 0;
          var g = 0;
          this.pathArray = [];
          this.tileMap = tileMap;
          this.openList = [];
          this.closeList = [];
          this.startTile = tileMap.startTile;
          this.endTile = tileMap.endTile;
          this.startTile.tileData.g = 0;
          this.startTile.tileData.h = this.heuristic(this.startTile);
          this.startTile.tileData.f = this.startTile.tileData.g + this.startTile.tileData.h;
          return this.searchPath();
    }

    private isOpen(tile : Tile):any{
        for(var i = 0 ; i < this.openList.length ; i++){
            if( tile == this.openList[i] ){
                return true;
            }
        }
        return false;
    }

    private isClosed(tile : Tile):any{
        for(var i = 0 ; i < this.closeList.length ; i++){
            if( tile == this.closeList[i] ){
                return true;
            }
        }
        return false;
    }

    private findMinFInOpenArray():any{
        var i = 0;
        var temp : Tile;
        for(var j = 0 ; j < this.openList.length ; j++){
            if( this.openList[i].tileData.f > this.openList[j].tileData.f){
                i = j;
            }
        }
        temp = this.openList[i];
        for( j = i ; j < this.openList.length - 1; j++){
            this.openList[j] = this.openList[j + 1];
        }
        this.openList.pop();
        return temp;
    }

    public searchPath():any{
        var tile = this.startTile;
        
        while( tile != this.endTile){
            var startX:number = Math.max(0, tile.tileData.x - 1);
            var endX:number = Math.min(this.tileMap.numCols - 1, tile.tileData.x + 1);
            var startY:number = Math.max(0, tile.tileData.y - 1);
            var endY:number = Math.min(this.tileMap.numRows - 1, tile.tileData.y + 1);
            for(var i:number = startX; i <= endX; i++){
                for(var j:number = startY; j <= endY; j++){
                    var test:Tile = this.tileMap.getTile(i, j);
                    if(test == tile ||!test.tileData.walkable ||!this.tileMap.getTile(tile.tileData.x, test.tileData.y).tileData.walkable ||!this.tileMap.getTile(test.tileData.x, tile.tileData.y).tileData.walkable){
                        continue;
                    }
                    var cost:number = this.straightCost;
                    if(!((tile.tileData.x == test.tileData.x) || (tile.tileData.y == test.tileData.y))){
                        cost = this.diagCost;
                    }
                    var g:number = tile.tileData.g + cost * test.tileData.costMultiplier;
                    var h:number = this.heuristic(test);
                    var f:number = g + h;
                    if(this.isOpen(test) || this.isClosed(test)){
                       if(test.tileData.f > f){
                          test.tileData.f = f;
                          test.tileData.g = g;
                          test.tileData.h = h;
                          test.tileParent = tile;
                        }
                    }
                    else{
                        test.tileData.f = f;
                        test.tileData.g = g;
                        test.tileData.h = h;
                        test.tileParent = tile;
                        this.openList.push(test);
                    }

                }
            }
            this.closeList.push(tile);
            if(this.openList.length == 0){
                console.log("no path found");
                return false
            }
            tile = this.findMinFInOpenArray();
        }
        this.buildPath();
        return true;

    }

private buildPath():void{
    
    var tile:Tile = this.endTile;
    this.pathArray.push(tile);
    while(tile != this.startTile){
        tile = tile.tileParent;
        this.pathArray.unshift(tile);
    }
}


private emanhattan(tile:Tile):number {
return Math.abs(tile.x - this.endTile.tileData.x) * this.straightCost +
Math.abs(tile.y + this.endTile.tileData.y) * this.straightCost;
}

private euclidian(tile:Tile):number
{
var dx:number = tile.x - this.endTile.tileData.x;
var dy:number = tile.y - this.endTile.tileData.y;
return Math.sqrt(dx * dx + dy * dy) * this.straightCost;
}

private diagonal(tile:Tile):number
{
var dx:number = Math.abs(tile.tileData.x - this.endTile.tileData.x);
var dy:number = Math.abs(tile.tileData.y - this.endTile.tileData.y);
var diag:number = Math.min(dx, dy);
var straight:number = dx + dy;
return this.diagCost * diag + this.straightCost * (straight - 2 * diag);
}

}