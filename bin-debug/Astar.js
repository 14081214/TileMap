var AStar = (function () {
    function AStar() {
        this.straightCost = 1.0;
        this.diagCost = Math.SQRT2;
        this.heuristic = this.diagonal;
    }
    var d = __define,c=AStar,p=c.prototype;
    ;
    p.findPath = function (tileMap) {
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
    };
    p.isOpen = function (tile) {
        for (var i = 0; i < this.openList.length; i++) {
            if (tile == this.openList[i]) {
                return true;
            }
        }
        return false;
    };
    p.isClosed = function (tile) {
        for (var i = 0; i < this.closeList.length; i++) {
            if (tile == this.closeList[i]) {
                return true;
            }
        }
        return false;
    };
    p.findMinFInOpenArray = function () {
        var i = 0;
        var temp;
        for (var j = 0; j < this.openList.length; j++) {
            if (this.openList[i].tileData.f > this.openList[j].tileData.f) {
                i = j;
            }
        }
        temp = this.openList[i];
        for (j = i; j < this.openList.length - 1; j++) {
            this.openList[j] = this.openList[j + 1];
        }
        this.openList.pop();
        return temp;
    };
    p.searchPath = function () {
        var tile = this.startTile;
        while (tile != this.endTile) {
            var startX = Math.max(0, tile.tileData.x - 1);
            var endX = Math.min(this.tileMap.numCols - 1, tile.tileData.x + 1);
            var startY = Math.max(0, tile.tileData.y - 1);
            var endY = Math.min(this.tileMap.numRows - 1, tile.tileData.y + 1);
            for (var i = startX; i <= endX; i++) {
                for (var j = startY; j <= endY; j++) {
                    var test = this.tileMap.getTile(i, j);
                    if (test == tile || !test.tileData.walkable || !this.tileMap.getTile(tile.tileData.x, test.tileData.y).tileData.walkable || !this.tileMap.getTile(test.tileData.x, tile.tileData.y).tileData.walkable) {
                        continue;
                    }
                    var cost = this.straightCost;
                    if (!((tile.tileData.x == test.tileData.x) || (tile.tileData.y == test.tileData.y))) {
                        cost = this.diagCost;
                    }
                    var g = tile.tileData.g + cost * test.tileData.costMultiplier;
                    var h = this.heuristic(test);
                    var f = g + h;
                    if (this.isOpen(test) || this.isClosed(test)) {
                        if (test.tileData.f > f) {
                            test.tileData.f = f;
                            test.tileData.g = g;
                            test.tileData.h = h;
                            test.tileParent = tile;
                        }
                    }
                    else {
                        test.tileData.f = f;
                        test.tileData.g = g;
                        test.tileData.h = h;
                        test.tileParent = tile;
                        this.openList.push(test);
                    }
                }
            }
            this.closeList.push(tile);
            if (this.openList.length == 0) {
                console.log("no path found");
                return false;
            }
            tile = this.findMinFInOpenArray();
        }
        this.buildPath();
        return true;
    };
    p.buildPath = function () {
        var tile = this.endTile;
        this.pathArray.push(tile);
        while (tile != this.startTile) {
            tile = tile.tileParent;
            this.pathArray.unshift(tile);
        }
    };
    p.emanhattan = function (tile) {
        return Math.abs(tile.x - this.endTile.tileData.x) * this.straightCost +
            Math.abs(tile.y + this.endTile.tileData.y) * this.straightCost;
    };
    p.euclidian = function (tile) {
        var dx = tile.x - this.endTile.tileData.x;
        var dy = tile.y - this.endTile.tileData.y;
        return Math.sqrt(dx * dx + dy * dy) * this.straightCost;
    };
    p.diagonal = function (tile) {
        var dx = Math.abs(tile.tileData.x - this.endTile.tileData.x);
        var dy = Math.abs(tile.tileData.y - this.endTile.tileData.y);
        var diag = Math.min(dx, dy);
        var straight = dx + dy;
        return this.diagCost * diag + this.straightCost * (straight - 2 * diag);
    };
    return AStar;
}());
egret.registerClass(AStar,'AStar');
//# sourceMappingURL=Astar.js.map