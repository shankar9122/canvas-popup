import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const gridWidth = 64;
const gridHeight = 36;

const imgSizeSmall = 40;
const imgSizeMedium = 64;
const imgSizeLarge = 256;

function CanvasComponent() {
    const [imageUrls, setImageUrls] = useState([]);
    const canvasRef = useRef(null)

    useEffect(() => {
        axios.get('https://jsonplaceholder.typicode.com/albums/1/photos')
            .then(response => {
                setImageUrls(response.data);
                console.log("data", response.data)
            })
            .catch(error => {
                console.log(error);
            });
    }, []);

    function loadImages(urls, numCols) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        let isZoomedIn = false;
        let zoomedImageIndex;

        const images = urls.map(url => {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.src = url.url;
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
            const colWidth = canvas.width / numCols;
            const rowHeight = canvas.height / numRows;

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
                    // redrawCanvas(images, numCols);
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

        // function redrawCanvas(images, numCols) {
        //     context.clearRect(0, 0, canvas.width, canvas.height);
        //     images.forEach((image, i) => {
        //         if (i !== zoomedImageIndex) {
        //             const colIndex = i % numCols;
        //             const rowIndex = Math.floor(i / numCols);
        //             const x = colIndex * 2;
        //             const y = rowIndex * 2;
        //             context.drawImage(image, x, y, 100, 100);
        //         }
        //     });
        // }
    }

    useEffect(() => {
        if (imageUrls.length > 0) {
            loadImages(imageUrls, 5);
        }
    }, [imageUrls]);

    return (
        <canvas ref={canvasRef} id="canvas" width="800" height="600"></canvas>
    );
}

export default CanvasComponent;