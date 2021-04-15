;(function(window ,document) {
    let lastX, lastY
    let itemsID = 0
    let itemOnChecked = false
    let lineWidth = 5

    const docTitle = document.title
    const canvas = document.getElementById('canvasWrap')
    const ctx = canvas.getContext('2d')
    const canvasInfo = {
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        width: canvas.width,
        height: canvas.height,
        ratioX: canvas.clientWidth / canvas.width,
        ratioY: canvas.clientHeight / canvas.height,
    }
    const imgItems = []
    const itemButton = document.querySelectorAll('.element-group .link')

    // 回饋響應式畫板當下接觸點的像素
    function getNaturalSize(nowNumber, ratio) {
        return Math.round(nowNumber / ratio * 100) / 100
    }

    // 進行圖片組的繪製
    function drawItems(array) {
        ctx.clearRect(0, 0, canvasInfo.width, canvasInfo.height)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvasInfo.width, canvasInfo.height)

        array.forEach(function(item) {
            ctx.drawImage(item.target, item.originX, item.originY, item.eleWidth, item.eleHeight)

            if(item.hoverOn && !itemOnChecked) {
                ctx.lineWidth = lineWidth
                ctx.strokeStyle = '#23f3fa';
                ctx.setLineDash([lineWidth * 2, lineWidth * 3])
                ctx.lineCap = 'round'
                ctx.strokeRect(item.originX, item.originY, item.eleWidth, item.eleHeight)
            }

            if(item.checkOn) {
                ctx.lineWidth = lineWidth * 2
                ctx.strokeStyle = '#fc127b';
                ctx.setLineDash([])
                ctx.lineJoin = 'round'
                ctx.strokeRect(item.originX, item.originY, item.eleWidth, item.eleHeight)
            }

            if(item.focusOn) {
                ctx.lineWidth = lineWidth * 3
                ctx.strokeStyle = '#fd88df';
                ctx.setLineDash([])
                ctx.lineJoin = 'round'
                ctx.strokeRect(item.originX, item.originY, item.eleWidth, item.eleHeight)
            }
        })
    }

    // 清除元件選取
    function clearFocus() {
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                item.focusOn = false
            }
        })
        drawItems(imgItems)
    }

    itemButton.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault()

            const itemImg = new Image()
            itemImg.crossOrigin = 'anonymous'
            itemImg.src = item.getAttribute('href')
            itemImg.onload = function(){
                itemsID += 1
                ctx.drawImage(itemImg, itemsID * 10, itemsID * 10, itemImg.width, itemImg.height)

                imgItems.push({
                    id: itemsID,
                    eleHeight: itemImg.height,
                    eleWidth: itemImg.width,
                    originX: itemsID * 10,
                    originY: itemsID * 10,
                    target: itemImg,
                    focusOn: false,
                    hoverOn: false,
                    checkOn: false,
                })
            }
            console.log(imgItems);
        })
    })

    canvas.addEventListener('mousedown', function(e){
        e.preventDefault()

        const naturalX = getNaturalSize(e.offsetX, canvasInfo.ratioX)
        const naturalY = getNaturalSize(e.offsetY, canvasInfo.ratioY)
        itemOnChecked = true
        lastX = null
        lastY = null

        // mouseDown check
        for (let i = 0; i < imgItems.length; i++) {
            const ele = imgItems[i]
            const {eleHeight, eleWidth, originX, originY,} = ele

            if(originX < naturalX && naturalX < originX + eleWidth && originY < naturalY && naturalY < originY + eleHeight) {
                ele.checkOn = true
                ele.focusOn = true
                for (let j = 0; j < i; j++) {
                    if(imgItems[j].checkOn) {
                        imgItems[j].checkOn = false
                    }
                }
                for (let k = 0; k < imgItems.length; k++) {
                    if(k === i) {
                        continue
                    }
                    imgItems[k].focusOn = false
                }
            } else {
                ele.checkOn = false
                ele.focusOn = false
            }
        }

        drawItems(imgItems)
    })

    canvas.addEventListener('mousemove', function(e) {
        e.preventDefault()

        const naturalX = getNaturalSize(e.offsetX, canvasInfo.ratioX)
        const naturalY = getNaturalSize(e.offsetY, canvasInfo.ratioY)
        const offsetX = (lastX !== null)? naturalX - lastX: 0;
        const offsetY = (lastY !== null)? naturalY - lastY: 0;
        lastX = naturalX
        lastY = naturalY

        // hoverOn check
        for (let i = 0; i < imgItems.length; i++) {
            const ele = imgItems[i]
            const {eleHeight, eleWidth, originX, originY,} = ele

            if(originX < naturalX && naturalX < originX + eleWidth && originY < naturalY && naturalY < originY + eleHeight) {
                ele.hoverOn = true
                for (let j = 0; j < i; j++) {
                    if(imgItems[j].hoverOn) {
                        imgItems[j].hoverOn = false
                    }
                }
            } else {
                ele.hoverOn = false
            }
        }

        imgItems.forEach(function(item) {
            if(item.checkOn) {
                item.originX += offsetX
                item.originY += offsetY
            }
        })

        drawItems(imgItems)
    })



    canvas.addEventListener('mouseup', function(e){
        e.preventDefault()

        itemOnChecked = false
        lastX = null
        lastY = null

        imgItems.forEach(function(item) {
            item.checkOn = false
        })

        drawItems(imgItems)
    })

    canvas.addEventListener('mouseleave', function(e) {
        e.preventDefault()

        imgItems.forEach(function(item) {
            if(item.hoverOn) {
                item.hoverOn = false
            }
            if(item.checkOn) {
                item.checkOn = false
            }
        })
        drawItems(imgItems)
    })

    document.getElementById('clearFocus').addEventListener('click', function(e) {
        e.preventDefault()
        clearFocus()
    })

    document.getElementById('imgDownload').addEventListener('click', function(e) {
        clearFocus()

        const downloadImg = canvas.toDataURL('image/jpeg', .75)

        this.download = docTitle + '_' + Date.now() + '.jpg'
        this.href = canvas.toDataURL('image/png')
    })
})(window ,document)
