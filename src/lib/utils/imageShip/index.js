export default function imageShip(imgWidth = 100, imgHeight = 100) {
    const ship = new ImageShip(imgWidth, imgHeight);
    return ship;
}

function ImageShip(imgWidth, imgHeight) {
    this._width = 1024;
    this._height = 1024;
    this._ratio = 1;
    this._margin = {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5
    };
    this._gapX = 5;
    this._gapY = 5;
    this._imgWidth = imgWidth;
    this._imgHeight = imgHeight;

    this._gridWidth = Math.floor( 
        (this._width - this._margin.left - this._margin.right) / 
        (imgWidth + this._gapX) 
    );
    this._gridHeight = Math.floor(
        (this._height - this._margin.top - this._margin.bottom) / 
        (imgHeight + this._gapY)
    );

    const offCanvas = document.createElement('canvas');
    offCanvas.width = this._width * ratio;
    offCanvas.height = this._height * ratio;
    offCanvas.style.width = this._width;
    offCanvas.style.height = this._height;

    this._canvas = offCanvas;
    this._ctx = offCanvas.getContext('2d');
}

var shipProto = imageShip.prototype = ImageShip.prototype;



