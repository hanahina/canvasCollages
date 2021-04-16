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
        translate: 0,

    }
    const itemOffset = 10
    const imgItems = []
    const itemButton = document.querySelectorAll('.element-group .link')

    // 回饋響應式畫板當下接觸點的像素
    function getNaturalSize(nowNumber, ratio) {
        return Math.round(nowNumber / ratio * 100) / 100
    }

    // 角度轉弧度
    function degToArc(degree) {
        const transArc = Math.PI / 180 * degree
        return transArc
    }

    // 弧度轉角度
    function arcToDeg(arc) {
        const transDeg = 180 / Math.PI * arc
        return transDeg
    }

    // 三點求面積
    function areaInThreePoint(ax, ay, bx, by, cx, cy) {
        const finalArea = Math.abs((ax * by + bx * cy + cx * ay - ax * cy - cx * by - bx * ay) / 2)
        return finalArea
    }

    // 進行圖片組的繪製
    function drawItems(array) {
        ctx.clearRect(0, 0, canvasInfo.width, canvasInfo.height)
        // 紀錄原始狀態
        ctx.save();
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvasInfo.width, canvasInfo.height)

        array.forEach(function(item) {
            const {target, originX, originY, eleWidth, eleHeight, eleTranslate, eleRotate, hoverOn, checkOn, focusOn} = item
            const startX = originX - eleTranslate[0]
            const startY = originY - eleTranslate[1]

            ctx.restore()
            ctx.translate(eleTranslate[0], eleTranslate[1])
            ctx.rotate(degToArc(eleRotate))
            ctx.drawImage(target, startX, startY, eleWidth, eleHeight)


            ctx.lineWidth = lineWidth * 5
            ctx.strokeStyle = 'purple';
            ctx.setLineDash([0, lineWidth * 15])
            ctx.lineCap = 'round'
            ctx.strokeRect(startX, startY, eleWidth, eleHeight)

            if(hoverOn && !itemOnChecked) {
                ctx.lineWidth = lineWidth
                ctx.strokeStyle = '#23f3fa';
                ctx.setLineDash([lineWidth * 2, lineWidth * 3])
                ctx.lineCap = 'round'
                ctx.strokeRect(startX, startY, eleWidth, eleHeight)
            }

            if(checkOn) {
                ctx.lineWidth = lineWidth * 2
                ctx.strokeStyle = '#fc127b';
                ctx.setLineDash([])
                ctx.lineJoin = 'round'
                ctx.strokeRect(startX, startY, eleWidth, eleHeight)
            }

            if(focusOn) {
                ctx.lineWidth = lineWidth * 3
                ctx.strokeStyle = '#fd88df';
                ctx.setLineDash([])
                ctx.lineJoin = 'round'
                ctx.strokeRect(startX, startY, eleWidth, eleHeight)
            }
            // 回復原始狀態
            ctx.rotate(degToArc(eleRotate) * -1)
            ctx.translate(eleTranslate[0] * -1, eleTranslate[1] * -1)
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

    window.addEventListener('resize', function(e) {
        console.log('window resize');
    })

    itemButton.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault()

            const itemImg = new Image()
            itemImg.crossOrigin = 'anonymous'
            itemImg.src = item.getAttribute('href')
            itemImg.onload = function(){
                itemsID += 1
                imgItems.push({
                    id: itemsID,
                    eleHeight: itemImg.height,
                    eleWidth: itemImg.width,
                    originX: itemsID * itemOffset,
                    originY: itemsID * itemOffset,
                    originHeight: itemImg.height,
                    originWidth: itemImg.width,
                    target: itemImg,
                    focusOn: false,
                    hoverOn: false,
                    checkOn: false,
                    eleTranslate: [0, 0],
                    eleRotate: 0,
                })
                drawItems(imgItems)
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
            const {eleHeight, eleWidth, originX, originY, eleRotate, } = ele

            const centerX = originX + eleWidth / 2
            const centerY = originY + eleHeight / 2
            const itemLength = Math.sqrt(Math.pow(eleWidth / 2, 2) + Math.pow(eleHeight / 2, 2))

            const fourCorner = {
                corner1: [originX + eleWidth, originY + eleHeight],
                corner2: [originX, originY + eleHeight],
                corner3: [originX, originY],
                corner4: [originX + eleWidth, originY],
            }
            const fourDegree = {
                degree1: arcToDeg(Math.acos((fourCorner.corner1[0] - centerX) / itemLength)),
                degree2: arcToDeg(Math.acos((fourCorner.corner2[0] - centerX) / itemLength)),
                degree3: arcToDeg(Math.acos((centerX - fourCorner.corner3[0]) / itemLength) + Math.PI),
                degree4: arcToDeg(Math.acos((centerX - fourCorner.corner4[0]) / itemLength) + Math.PI),
            }
            const newFourCorner = {
                corner1: [centerX + Math.cos(degToArc(fourDegree.degree1 + eleRotate)) * itemLength, centerY + Math.sin(degToArc(fourDegree.degree1 + eleRotate)) * itemLength],
                corner2: [centerX + Math.cos(degToArc(fourDegree.degree2 + eleRotate)) * itemLength, centerY + Math.sin(degToArc(fourDegree.degree2 + eleRotate)) * itemLength],
                corner3: [centerX + Math.cos(degToArc(fourDegree.degree3 + eleRotate)) * itemLength, centerY + Math.sin(degToArc(fourDegree.degree3 + eleRotate)) * itemLength],
                corner4: [centerX + Math.cos(degToArc(fourDegree.degree4 + eleRotate)) * itemLength, centerY + Math.sin(degToArc(fourDegree.degree4 + eleRotate)) * itemLength],
            }
            const {corner1, corner2, corner3, corner4} = newFourCorner
            const areaSum = areaInThreePoint(naturalX, naturalY, corner1[0], corner1[1], corner2[0], corner2[1]) + areaInThreePoint(naturalX, naturalY, corner2[0], corner2[1], corner3[0], corner3[1]) +areaInThreePoint(naturalX, naturalY, corner3[0], corner3[1], corner4[0], corner4[1]) +areaInThreePoint(naturalX, naturalY, corner4[0], corner4[1], corner1[0], corner1[1])

            if(Math.round(areaSum) === eleHeight * eleWidth) {
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
            const {eleHeight, eleWidth, originX, originY, eleRotate,} = ele

            const centerX = originX + eleWidth / 2
            const centerY = originY + eleHeight / 2
            const itemLength = Math.sqrt(Math.pow(eleWidth / 2, 2) + Math.pow(eleHeight / 2, 2))

            const fourCorner = {
                corner1: [originX + eleWidth, originY + eleHeight],
                corner2: [originX, originY + eleHeight],
                corner3: [originX, originY],
                corner4: [originX + eleWidth, originY],
            }
            const fourDegree = {
                degree1: arcToDeg(Math.acos((fourCorner.corner1[0] - centerX) / itemLength)),
                degree2: arcToDeg(Math.acos((fourCorner.corner2[0] - centerX) / itemLength)),
                degree3: arcToDeg(Math.acos((centerX - fourCorner.corner3[0]) / itemLength) + Math.PI),
                degree4: arcToDeg(Math.acos((centerX - fourCorner.corner4[0]) / itemLength) + Math.PI),
            }
            const newFourCorner = {
                corner1: [centerX + Math.cos(degToArc(fourDegree.degree1 + eleRotate)) * itemLength, centerY + Math.sin(degToArc(fourDegree.degree1 + eleRotate)) * itemLength],
                corner2: [centerX + Math.cos(degToArc(fourDegree.degree2 + eleRotate)) * itemLength, centerY + Math.sin(degToArc(fourDegree.degree2 + eleRotate)) * itemLength],
                corner3: [centerX + Math.cos(degToArc(fourDegree.degree3 + eleRotate)) * itemLength, centerY + Math.sin(degToArc(fourDegree.degree3 + eleRotate)) * itemLength],
                corner4: [centerX + Math.cos(degToArc(fourDegree.degree4 + eleRotate)) * itemLength, centerY + Math.sin(degToArc(fourDegree.degree4 + eleRotate)) * itemLength],
            }
            const {corner1, corner2, corner3, corner4} = newFourCorner
            const areaSum = areaInThreePoint(naturalX, naturalY, corner1[0], corner1[1], corner2[0], corner2[1]) + areaInThreePoint(naturalX, naturalY, corner2[0], corner2[1], corner3[0], corner3[1]) +areaInThreePoint(naturalX, naturalY, corner3[0], corner3[1], corner4[0], corner4[1]) +areaInThreePoint(naturalX, naturalY, corner4[0], corner4[1], corner1[0], corner1[1])

            if(Math.round(areaSum) === eleHeight * eleWidth) {
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
            const itemArc = degToArc(item.eleRotate)
            if(item.checkOn) {
                item.originX = item.originX + offsetX * Math.cos(itemArc) + offsetY * Math.sin(itemArc)
                item.originY = item.originY - offsetX * Math.sin(itemArc) + offsetY * Math.cos(itemArc)
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





    // =================== start ===================
    //  按鈕功能組
    // ===================  end  ===================
    // 清除物件選取
    document.getElementById('clearFocus').addEventListener('click', function(e) {
        e.preventDefault()
        clearFocus()
    })

    // 圖片下載
    document.getElementById('imgDownload').addEventListener('click', function(e) {
        clearFocus()
        const downloadImg = canvas.toDataURL('image/jpeg', .75)
        this.download = docTitle + '_' + Date.now() + '.jpg'
        this.href = downloadImg
    })

    // 清理畫板
    document.getElementById('clearBoard').addEventListener('click', function(e) {
        e.preventDefault()
        imgItems.length = 0
        drawItems(imgItems)
    })

    // 刪除選取元件
    document.getElementById('deleteItem').addEventListener('click', function(e) {
        e.preventDefault()
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                const targetIndex = imgItems.indexOf(item)
                imgItems.splice(targetIndex, 1)
            }
        })
        drawItems(imgItems)
    })

    // 往前一層
    document.getElementById('goForwardLayer').addEventListener('click', function(e) {
        e.preventDefault()
        let targetIndex, targetObj
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                // 尋找目標物件
                targetIndex = imgItems.indexOf(item)
                // 取下目標物件
                targetObj = imgItems.splice(targetIndex, 1)
            }
        })
        // 往後推一格插回原陣列(陣列越後，圖層越上方)
        const insertIndex = (targetIndex + 1 < imgItems.length)? targetIndex + 1: imgItems.length
        imgItems.splice(insertIndex, 0, ...targetObj)
        drawItems(imgItems)
    })

    // 往後一層
    document.getElementById('goBackwardLayer').addEventListener('click', function(e) {
        e.preventDefault()
        let targetIndex, targetObj
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                // 尋找目標物件
                targetIndex = imgItems.indexOf(item)
                // 取下目標物件
                targetObj = imgItems.splice(targetIndex, 1)
            }
        })
        // 往前推一格插回原陣列(陣列越前，圖層越下方)
        const insertIndex = (targetIndex - 1 > 0)? targetIndex - 1: 0
        imgItems.splice(insertIndex, 0, ...targetObj)
        drawItems(imgItems)
    })

    // 移至最前
    document.getElementById('goFrontLayer').addEventListener('click', function(e) {
        e.preventDefault()
        let targetIndex, targetObj
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                // 尋找目標物件
                targetIndex = imgItems.indexOf(item)
                // 取下目標物件
                targetObj = imgItems.splice(targetIndex, 1)
            }
        })
        // 插回原陣列最後面
        imgItems.push(...targetObj)
        drawItems(imgItems)
    })

    // 移至最後
    document.getElementById('goBackLayer').addEventListener('click', function(e) {
        e.preventDefault()
        let targetIndex, targetObj
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                // 尋找目標物件
                targetIndex = imgItems.indexOf(item)
                // 取下目標物件
                targetObj = imgItems.splice(targetIndex, 1)
            }
        })
        // 插回原陣列最前面
        imgItems.unshift(...targetObj)
        drawItems(imgItems)
    })

    // 放大
    document.getElementById('zoomIn').addEventListener('click', function(e) {
        e.preventDefault()
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                const zoomInHeight = item.eleHeight + item.originHeight / 10
                const zoomInWidth = item.eleWidth + item.originWidth / 10
                item.eleHeight = zoomInHeight
                item.eleWidth = zoomInWidth
            }
        })
        drawItems(imgItems)
    })

    // 縮小
    document.getElementById('zoomOut').addEventListener('click', function(e) {
        e.preventDefault()
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                const zoomOutHeight = item.eleHeight - item.originHeight / 10
                const zoomOutWidth = item.eleWidth - item.originWidth / 10
                item.eleHeight = (zoomOutHeight > 0)? zoomOutHeight: 0
                item.eleWidth = (zoomOutWidth > 0)? zoomOutWidth: 0
            }
        })
        drawItems(imgItems)
    })

    // 順時針旋轉
    document.getElementById('clockWise').addEventListener('click', function(e) {
        e.preventDefault()
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                item.eleRotate = (item.eleRotate + 15) % 360
                item.eleTranslate[0] = item.originX + item.eleWidth / 2
                item.eleTranslate[1] = item.originY + item.eleHeight / 2
            }
        })
        drawItems(imgItems)
    })

    // 逆時針旋轉
    document.getElementById('antiClockWise').addEventListener('click', function(e) {
        e.preventDefault()
        imgItems.forEach(function(item) {
            if(item.focusOn) {
                item.eleRotate = (item.eleRotate - 15) % 360
                item.eleTranslate[0] = item.originX + item.eleWidth / 2
                item.eleTranslate[1] = item.originY + item.eleHeight / 2
            }
        })
        drawItems(imgItems)
    })


    console.log(areaInThreePoint(0, 0, 0, 4, 3, 0));
})(window ,document)
