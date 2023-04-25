$('#canvas').height($('#canvas').width() / 1.777);

$(window).resize(function () {
    $('#canvas').height($('#canvas').width() / 1.777);
});

$("#uploadImgForm").submit(function (e) {
    e.preventDefault();
    var formData = new FormData(this);
    console.log(this);
    console.log(formData);

    //const video = document.querySelector('video');
    //console.log(video.videoWidth + "x" + video.videoHeight);

    $('#submitButton').prop('disabled', true);

    $.ajax({
        type: "POST",
        url: "/uploadPhoto",
        data: formData,
        processData: false,
        contentType: false,
        success: function (result) {
            console.log("result: " + result);
            // alert("Image Uploaded!");
            $('#submitButton').prop('disabled', false);
            //location.reload();
            window.location.href = window.location.href.split('?')[0] + '?gridID=' + (result.imageID - 1);
        },
        error: function (err) {
            console.log("Unable to upload image: ", err);
            alert("Unable to upload image:\n" + err.responseText);
            $('#submitButton').prop('disabled', false);
        }
    });
});

var videoStream;

$("#openCam").click(async function () {
    try {
        //alert("The paragraph was clicked.");
        const constraints = { video: true };
        const video = document.querySelector('video');
        console.log(video.paused);
        //navigator.mediaDevices.getUserMedia(constraints).then((stream) => {video.srcObject = stream});
        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = videoStream;
        console.log(video.videoWidth + "x" + video.videoHeight);

        $("#clickImgButt").prop('disabled', false);
    }
    catch (error) {
        alert("Unable to access camera");
        console.log("Unable to access camera");
        console.log(error);
    }
});

$("#clickImgButt").click(function () {
    $("#clickImgButt").hide();
    $("#retakeButt").show();
    $("#saveImgButt").show();

    var video = document.getElementById("video");
    var videoCanvas = document.getElementById("videoCanvas");
    var snapImg = document.getElementById("snapImg");

    var videoRect = video.getBoundingClientRect();
    console.log(videoRect);
    videoCanvas.width = videoRect.width;
    videoCanvas.height = videoRect.height;
    //videoCanvas.style.top = videoRect.top;
    //videoCanvas.style.left = videoRect.left;
    //videoCanvas.style.display = "block";

    snapImg.width = videoRect.width;
    snapImg.height = videoRect.height;
    //snapImg.style.top = videoRect.top;
    //snapImg.style.left = videoRect.left;
    snapImg.style.display = "block";

    videoCanvas.getContext('2d').drawImage(video, 0, 0, videoRect.width, videoRect.height);
    snapImg.src = videoCanvas.toDataURL('image/jpg');
    video.style.display = "none";
});

$("#retakeButt").click(function () {
    $("#clickImgButt").show();
    $("#retakeButt").hide();
    $("#saveImgButt").hide();

    snapImg.style.display = "none";
    video.style.display = "block";

    clickedPic.src = "";
    clickedPic.style.display = "none";
    document.getElementById("photo").setAttribute("value", "");
});

$("#saveImgButt").click(function () {
    var videoCanvas = document.getElementById("videoCanvas");
    var imageData = videoCanvas.toDataURL('image/jpg');
    var clickedPic = document.getElementById("clickedPic");
    clickedPic.src = imageData;
    clickedPic.style.display = "block";
    clickedPic.width = 100 * videoCanvas.width / videoCanvas.height;

    document.getElementById("photo").setAttribute("value", imageData);

    //$("#clickedPic").src = $("#videoCanvas").toDataURL('image/jpg');
    $('#picClickModal').modal('toggle');
});

$("#picClickModal").on("hidden.bs.modal", function () {
    videoStream.getTracks().forEach(function (track) {
        track.stop();
    });

    console.log("Modal closed");
});

// https://jsonplaceholder.typicode.com/albums/1/photos
const gridWidth = 64;
const gridHeight = 36;

const imgSizeSmall = 16;
const imgSizeMedium = 64;
const imgSizeLarge = 256;

const colorAlpha = 0.7;
const bgAlpha = 0.5;
const nameFontSize = 26;
const commentFontSize = 16;

const primaryLimit = 30;

var openImgX;
var openImgY;
var openImgIndex;
var isInteractable = false;
var ANIM_STATES =
{
    closed: 0,
    opening: 1,
    open: 2,
    closing: 3
};
var animState = ANIM_STATES.closed;             //0:closed, 1: opening, 2: open, 3: closing
var animStartTime;

var primaryCount = 0;

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;    // relationship bitmap vs. element for X
    const scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    return { x: x, y: y };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

window.onload = function () {
    var urlParamGridIDStr = getUrlParameter('gridID');

    var drawingCanvas = document.getElementById('canvas');
    // Check the element is in the DOM and the browser supports canvas
    if (drawingCanvas && drawingCanvas.getContext) {
        // Initaliase a 2-dimensional drawing context
        ctxctx = drawingCanvas.getContext('2d');
        width = ctx.canvas.width;
        height = ctx.canvas.height;

        $.ajax(
            {
                type: "GET",
                url: "/logoLink",
                dataType: "json",
                success: function (logoJSON) {
                    var logo_large = new Image();
                    logo_large.onload = function () {
                        ctx.drawImage(logo_large, 0, 0, width, height);

                        var bnwLogoData = ctx.getImageData(0, 0, width, height);
                        var largeData = bnwLogoData.data;
                        for (var i = 0; i < largeData.length; i += 4) {
                            var brightness = 0.34 * largeData[i] + 0.5 * largeData[i + 1] + 0.16 * largeData[i + 2];
                            // red
                            largeData[i] = brightness;
                            // green
                            largeData[i + 1] = brightness;
                            // blue
                            largeData[i + 2] = brightness;
                        }
                        ctx.putImageData(bnwLogoData, 0, 0);

                        var logo_small = new Image();
                        var logo_small_data;
                        logo_small.onload = function () {
                            // create offscreen buffer
                            buffer = document.createElement('canvas');
                            buffer.width = logo_small.width;
                            buffer.height = logo_small.height;
                            btx = buffer.getContext('2d');
                            btx.drawImage(logo_small, 0, 0);

                            logo_small_data = btx.getImageData(0, 0, buffer.width, buffer.height);
                            var smallData = logo_small_data.data;

                            // Get grid positions of images
                            $.ajax(
                                {
                                    type: "GET",
                                    url: "/getGrid",
                                    dataType: "json",
                                    success: function (gridJSON) {
                                        console.log(gridJSON);

                                        // Get list of all images
                                        $.ajax(
                                            {
                                                type: "GET",
                                                url: "/listImages",
                                                dataType: "json",
                                                success: function (imgListJSON) {
                                                    //console.log(imgListJSON);                
                                                    console.log("Image Count: " + imgListJSON.images.length);

                                                    // Map imageIDs to their index in imgListJSON, so we can easily find an imageID's index in list
                                                    var idIndexMap = {};
                                                    for (var i = 0; i < imgListJSON.images.length; i++) {
                                                        idIndexMap[imgListJSON.images[i].id] = i;
                                                    }
                                                    imgListJSON.idIndexMap = idIndexMap;

                                                    console.log(imgListJSON);

                                                    var imgLeftToLoad = imgListJSON.images.length;

                                                    // Load images returned from /listImages to an array
                                                    var smallImgs = new Array(imgListJSON.images.length);
                                                    var largeImgs = new Array(imgListJSON.images.length);

                                                    // Function to load large image into array. Only called when needed to load large image
                                                    var loadLargeImg = function (largeImgIndex) {
                                                        largeImgs[largeImgIndex] = new Image();
                                                        largeImgs[largeImgIndex].crossOrigin = "Anonymous";
                                                        largeImgs[largeImgIndex].src = encodeURI(imgListJSON.images[largeImgIndex].largeURL);
                                                    }

                                                    imgListJSON.images.forEach(function (imgJSON, imgIndex) {
                                                        smallImgs[imgIndex] = new Image();
                                                        smallImgs[imgIndex].onload = function (ret) {
                                                            //console.log("Loaded: " + index);

                                                            // Function to draw images in grid as they load, with or without delay
                                                            async function drawDelayed() {
                                                                var buffer = [];
                                                                for (var i = 0; i < gridJSON.grid.length; i++) {
                                                                    buffer.push(i);
                                                                }
                                                                var randomSeries = [];
                                                                for (var i = 0; i < gridJSON.grid.length; i++) {
                                                                    var buffIndex = Math.floor(Math.random() * buffer.length);
                                                                    randomSeries.push(buffer[buffIndex]);
                                                                    buffer.splice(buffIndex, 1);
                                                                }

                                                                for (var i = 0; i < gridJSON.grid.length; i++) {
                                                                    var randIndex = randomSeries[i];
                                                                    var x = randIndex % gridWidth;
                                                                    var y = Math.floor(randIndex / gridWidth);

                                                                    // Do not show duplicate images if total images are less than the primary limit
                                                                    if (imgListJSON.images.length < primaryLimit && gridJSON.grid[randIndex].isPrimary == 0)
                                                                        continue;

                                                                    if (gridJSON.grid[randIndex].imageID == imgJSON.id && y < gridHeight) {
                                                                        ctx.drawImage(smallImgs[imgIndex], x * imgSizeSmall, y * imgSizeSmall, imgSizeSmall, imgSizeSmall);

                                                                        var colorIndex = randIndex * 4;
                                                                        ctx.fillStyle = `rgba(${smallData[colorIndex]}, ${smallData[colorIndex + 1]}, ${smallData[colorIndex + 2]}, ${colorAlpha})`;
                                                                        ctx.fillRect(x * imgSizeSmall, y * imgSizeSmall, imgSizeSmall, imgSizeSmall);

                                                                        if (urlParamGridIDStr == undefined)
                                                                            await sleep(80); //(0.8718 + (991.2816 / imgListJSON.images.length));
                                                                    }
                                                                }

                                                                imgLeftToLoad--;
                                                                if (imgLeftToLoad == 0) {
                                                                    console.log("All loaded");

                                                                    if (urlParamGridIDStr != undefined) {
                                                                        var urlParamGridIDInt = parseInt(urlParamGridIDStr);
                                                                        openImgX = urlParamGridIDInt % gridWidth;
                                                                        openImgY = Math.floor(urlParamGridIDInt / gridWidth);
                                                                        openImgIndex = imgListJSON.idIndexMap[gridJSON.grid[urlParamGridIDInt].imageID];
                                                                        console.log(openImgIndex + " " + openImgX + " " + openImgY);

                                                                        if (largeImgs[openImgIndex] == null)
                                                                            loadLargeImg(openImgIndex);

                                                                        animState = ANIM_STATES.open;
                                                                        isInteractable = true;
                                                                        animStartTime = (new Date()).getTime();
                                                                        window.requestAnimationFrame(stateCheck);
                                                                    }
                                                                    else
                                                                        isInteractable = true;
                                                                }
                                                            }

                                                            drawDelayed();
                                                            //refreshGrid();
                                                        };
                                                        smallImgs[imgIndex].crossOrigin = "Anonymous";
                                                        smallImgs[imgIndex].src = encodeURI(imgJSON.smallURL);
                                                    });

                                                    var redrawGrid = function () {
                                                        ctx.putImageData(bnwLogoData, 0, 0);

                                                        for (var i = 0; i < gridJSON.grid.length; i++) {
                                                            // Do not show duplicate images if total images are less than the primary limit
                                                            if (imgListJSON.images.length < primaryLimit && gridJSON.grid[i].isPrimary == 0)
                                                                continue;

                                                            var imgID = gridJSON.grid[i].imageID;
                                                            var imgIndex = imgListJSON.idIndexMap[imgID];
                                                            if (imgIndex == null || smallImgs[imgIndex] == null) {
                                                                console.log(i + " is null");
                                                                continue;
                                                            }
                                                            var x = i % gridWidth;
                                                            var y = Math.floor(i / gridWidth);
                                                            if (y >= gridHeight)
                                                                continue;

                                                            ctx.drawImage(smallImgs[imgIndex], x * imgSizeSmall, y * imgSizeSmall, imgSizeSmall, imgSizeSmall);

                                                            var colorIndex = i * 4;
                                                            ctx.fillStyle = `rgba(${smallData[colorIndex]}, ${smallData[colorIndex + 1]}, ${smallData[colorIndex + 2]}, ${colorAlpha})`;
                                                            ctx.fillRect(x * imgSizeSmall, y * imgSizeSmall, imgSizeSmall, imgSizeSmall);
                                                        }

                                                        console.log("redraw");
                                                    }

                                                    var lerp = function (start, end, percent) {
                                                        return ((end - start) * percent) + start;
                                                    }

                                                    function getLines(text, maxWidth) {
                                                        var words = text.split(" ");
                                                        var lines = [];
                                                        var currentLine = words[0];

                                                        for (var i = 1; i < words.length; i++) {
                                                            var word = words[i];
                                                            var width = ctx.measureText(currentLine + " " + word).width;
                                                            if (width < maxWidth) {
                                                                currentLine += " " + word;
                                                            } else {
                                                                lines.push(currentLine);
                                                                currentLine = word;
                                                            }
                                                        }
                                                        lines.push(currentLine);
                                                        return lines;
                                                    }

                                                    function drawPolaroid(percent) {
                                                        var posX = lerp(openImgX * imgSizeSmall, drawingCanvas.width / 2 - imgSizeLarge / 2, percent);
                                                        var posY = lerp(openImgY * imgSizeSmall, drawingCanvas.height / 2 - imgSizeLarge / 2, percent);
                                                        var size = lerp(imgSizeSmall, imgSizeLarge, percent);

                                                        redrawGrid();

                                                        // Faded BG
                                                        ctx.fillStyle = `rgba(128, 128, 128, ${bgAlpha * percent})`;
                                                        ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

                                                        // Draw polaroid paper
                                                        ctx.fillStyle = `rgba(255, 255, 255, ${percent})`;
                                                        ctx.fillRect(posX - size / 16, posY - size / 16, size + size / 8, size + size / 2.5);

                                                        // Draw black outline
                                                        ctx.fillStyle = `rgba(0, 0, 0, ${percent})`;
                                                        ctx.fillRect(posX - 1, posY - 1, size + 2, size + 2);

                                                        // Draw name
                                                        var textY = posY + size + size / 8;

                                                        ctx.fillStyle = `rgba(0, 0, 0, ${percent})`;
                                                        ctx.font = `${nameFontSize * percent}px Arial`;

                                                        var nameText = getLines(imgListJSON.images[openImgIndex].name, size);
                                                        //for(var i = 0; i < nameText.length; i++)
                                                        {
                                                            ctx.fillText(nameText[0], posX, textY);
                                                            textY += nameFontSize * percent * 1;
                                                        }

                                                        // Draw comment
                                                        //textY -= commentFontSize * percent;
                                                        ctx.font = `italic ${commentFontSize * percent}px Arial`;
                                                        var commentText = getLines(imgListJSON.images[openImgIndex].comment, size);
                                                        if (commentText.length > 2)
                                                            commentText[1] += "...";
                                                        for (var i = 0; i < commentText.length && i < 2; i++) {
                                                            ctx.fillText(commentText[i], posX, textY);
                                                            textY += commentFontSize * percent * 1;
                                                        }

                                                        if (largeImgs[openImgIndex] != null && largeImgs[openImgIndex].complete)
                                                            ctx.drawImage(largeImgs[openImgIndex], posX, posY, size, size);
                                                        else
                                                            ctx.drawImage(smallImgs[openImgIndex], posX, posY, size, size);

                                                        var colorIndex = ((openImgY * gridWidth) + openImgX) * 4;
                                                        ctx.fillStyle = `rgba(${smallData[colorIndex]}, ${smallData[colorIndex + 1]}, ${smallData[colorIndex + 2]}, ${colorAlpha * (1.0 - percent)})`;
                                                        ctx.fillRect(posX, posY, size, size);
                                                    }

                                                    function stateCheck() {
                                                        switch (animState) {
                                                            case ANIM_STATES.closed:
                                                                redrawGrid();
                                                                isInteractable = true;
                                                                break;
                                                            case ANIM_STATES.opening:
                                                                var timeDiff = (new Date()).getTime() - animStartTime;
                                                                var percent = timeDiff / 1500.0;
                                                                if (percent > 1.0) {
                                                                    percent = 1.0;
                                                                    animState = ANIM_STATES.open;
                                                                }
                                                                drawPolaroid(percent);

                                                                window.requestAnimationFrame(stateCheck);
                                                                break;
                                                            case ANIM_STATES.open:
                                                                drawPolaroid(1.0);

                                                                isInteractable = true;
                                                                if (largeImgs[openImgIndex] == null || !largeImgs[openImgIndex].complete)
                                                                    window.requestAnimationFrame(stateCheck);
                                                                break;
                                                            case ANIM_STATES.closing:
                                                                var timeDiff = (new Date()).getTime() - animStartTime;
                                                                var percent = timeDiff / 1000.0;
                                                                if (percent > 1.0) {
                                                                    percent = 1.0;
                                                                    animState = ANIM_STATES.closed;
                                                                }
                                                                drawPolaroid(1.0 - percent);

                                                                window.requestAnimationFrame(stateCheck);
                                                                break;
                                                        }
                                                    }

                                                    drawingCanvas.addEventListener('mousedown', function (e) {
                                                        if (isInteractable) {
                                                            var clickPos = getCursorPosition(drawingCanvas, e);
                                                            var clickedImgX = Math.floor(clickPos.x / imgSizeSmall);
                                                            var clickedImgY = Math.floor(clickPos.y / imgSizeSmall);
                                                            if (clickedImgX >= 0 && clickedImgX < gridWidth && clickedImgY >= 0 && clickedImgY < gridHeight) {
                                                                switch (animState) {
                                                                    case ANIM_STATES.closed:
                                                                        openImgX = clickedImgX;
                                                                        openImgY = clickedImgY;
                                                                        openImgIndex = imgListJSON.idIndexMap[gridJSON.grid[openImgY * gridWidth + openImgX].imageID];
                                                                        console.log(`gridIndex: ${openImgY * gridWidth + openImgX}, openImgX: ${openImgX}, openImgY: ${openImgY}, openImgIndex: ${openImgIndex}`);

                                                                        if (largeImgs[openImgIndex] == null)
                                                                            loadLargeImg(openImgIndex);

                                                                        animState = ANIM_STATES.opening;
                                                                        isInteractable = false;
                                                                        animStartTime = (new Date()).getTime();
                                                                        window.requestAnimationFrame(stateCheck);
                                                                        break;
                                                                    //case ANIM_STATES.opening:
                                                                    //    break;
                                                                    case ANIM_STATES.open:
                                                                        animState = ANIM_STATES.closing;
                                                                        isInteractable = false;
                                                                        animStartTime = (new Date()).getTime();
                                                                        window.requestAnimationFrame(stateCheck);
                                                                        break;
                                                                    //case ANIM_STATES.closing:
                                                                    //    break;
                                                                }
                                                            }
                                                        }
                                                    });
                                                },
                                                error: function (e) {
                                                    console.log("Unable to get image list: ", e);
                                                }
                                            });
                                    },
                                    error: function (e) {
                                        console.log("Unable to get grid list: ", e);
                                    }
                                });
                        };
                        logo_small.crossOrigin = "Anonymous";
                        logo_small.src = encodeURI(logoJSON.small);    //'images/logo_small.jpg';
                    };
                    logo_large.crossOrigin = "Anonymous";
                    logo_large.src = encodeURI(logoJSON.large);    //'images/logo_large.jpg';
                },
                error: function (e) {
                    console.log("Unable to get logo URL: ", e);
                }
            });
    }
}


function loadImages(urls, numCols) {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    let isZoomedIn = false;
    let zoomedImageIndex;
  
    const colWidth = canvas.width / numCols;
    const rowHeight = canvas.height / numRows;
    
    const images = urls.map(url => {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = url;
        image.onload = () => {
          resolve(image);
        };
        image.onerror = () => {
          reject(new Error(`Could not load image: ${image.src}`));
        };
      });
    });
  
    Promise.all(images).then(images => {
      const numRows = Math.ceil(images.length / numCols);
  
      images.forEach((image, i) => {
        const colIndex = i % numCols;
        const rowIndex = Math.floor(i / numCols);
        const x = colIndex * colWidth;
        const y = rowIndex * rowHeight;
        context.drawImage(image, x, y, colWidth, rowHeight);
      });
  
      canvas.addEventListener('click', event => {
        const x = event.offsetX;
        const y = event.offsetY;
        const clickedImageIndex = Math.floor(y / rowHeight) * numCols + Math.floor(x / colWidth);
        if (isZoomedIn) {
          isZoomedIn = false;
          redrawCanvas(images, numCols);
        } else {
          isZoomedIn = true;
          zoomedImageIndex = clickedImageIndex;
          const zoomedImage = images[zoomedImageIndex];
          context.drawImage(zoomedImage, canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
        }
      });
    }).catch(error => {
      console.log(error);
    });
  
    function redrawCanvas(images, numCols) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      images.forEach((image, i) => {
        const colIndex = i % numCols;
        const rowIndex = Math.floor(i / numCols);
        const x = colIndex * colWidth;
        const y = rowIndex * rowHeight;
        context.drawImage(image, x, y, colWidth, rowHeight);
      });
    }
  }