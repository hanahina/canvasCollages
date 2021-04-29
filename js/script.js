let editorSwitch = 'canvasEditor'
let itemsID = 0
let pinID = 0
let itemOnChecked = false  // 滑鼠是否按下中
let lineWidth = 5  // 畫版標示線寬度設定

const docTitle = document.title
const imgItems = []  // 畫板元件陣列
const canvasPins = []  // 錨點陣列
const canvas = document.getElementById('canvasWrap')
canvas.width = 2000
canvas.height = 2500
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
const itemOffset = 20  // 元件位移
const editor = document.getElementById('pinEditor')

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

// 計算X軸位移
function XaxisMove (origin, offset, itemArc) {
    return origin + offset * Math.abs(Math.cos(itemArc)) + offset * Math.abs(Math.sin(itemArc))
}

// 計算Y軸位移
function YaxisMove (origin, offset, itemArc) {
    return origin + offset * Math.abs(Math.sin(itemArc)) + offset * Math.abs(Math.cos(itemArc))
}

// 對角線長度計算
function diagonalLength(width, height) {
    return Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
}

// 相對四個角的座標
function getFourCorner(itemObj) {
    const {originX, originY, eleHeight, eleWidth, } = itemObj
    const fourCorner = {
        corner1: [originX, originY],
        corner2: [originX + eleWidth, originY],
        corner3: [originX + eleWidth, originY + eleHeight],
        corner4: [originX, originY + eleHeight],
    }
    return fourCorner
}

// 觸發範圍檢查
function rangeCheck(itemObj, naturalX, naturalY) {
    const {eleHeight, eleWidth, eleRotate, } = itemObj
    const fourCorner = getFourCorner(itemObj)
    const centerX = (fourCorner.corner1[0] + fourCorner.corner2[0] + fourCorner.corner3[0] + fourCorner.corner4[0]) / 4
    const centerY = (fourCorner.corner1[1] + fourCorner.corner2[1] + fourCorner.corner3[1] + fourCorner.corner4[1]) / 4
    const itemLength = diagonalLength(eleWidth, eleHeight) / 2
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

    return (Math.round(areaSum) > eleHeight * eleWidth * 0.99 && Math.round(areaSum) < eleHeight * eleWidth * 1.01)
}
// 取出指定圖層
function pickLayoutDown(ary) {
    const targetIndex = ary.findIndex(item => item.focusOn)
    const targetObj = (targetIndex !== -1)? ary.splice(targetIndex, 1): {};
    return {targetIndex, targetObj}
}

// 將圖層放入指定位置
function changeLayerOrder(array, action) {
    const {targetIndex, targetObj} = pickLayoutDown(array)
    let insertIndex
    switch (action) {
        case 'goForward':
            insertIndex = (targetIndex + 1 < array.length)? targetIndex + 1: array.length
            break;
        case 'goBackward':
            insertIndex = (targetIndex - 1 > 0)? targetIndex - 1: 0
            break;
        case 'goFront':
        default:
            insertIndex = array.length
            break;
        case 'goBack':
            insertIndex = 0
            break;
    }
    if(targetIndex !== -1) {
        array.splice(insertIndex, 0, ...targetObj)
        drawItems(array)
    }
}

// 檢查資料陣列中的最大流水ID
function arrayIdCheck(ary) {
    if(ary.length) {
        const aryIds = ary.map((item) => {
            return item.id
        })
        return Math.max(...aryIds)
    } else {
        return 0
    }
}

// 進行圖片組的繪製
function drawItems(array) {
    ctx.clearRect(0, 0, canvasInfo.width, canvasInfo.height)
    // 紀錄原始狀態
    ctx.save();
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvasInfo.width, canvasInfo.height)

    array.forEach(function(item) {
        const {target, originX, originY, eleWidth, eleHeight, eleRotate, hoverOn, checkOn, focusOn} = item
        const eleTranslate = [originX + eleWidth / 2, originY + eleHeight / 2]

        const startX = originX - eleTranslate[0]
        const startY = originY - eleTranslate[1]

        ctx.restore()
        ctx.translate(eleTranslate[0], eleTranslate[1])
        ctx.rotate(degToArc(eleRotate))
        ctx.drawImage(target, startX, startY, eleWidth, eleHeight)

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
    const targetItem = imgItems.find(item => item.focusOn)
    if(!!targetItem) {
        targetItem.focusOn = false
        drawItems(imgItems)
    }
}

// 建立新元件資料
function addNewPictureItem(item) {
    const itemImg = new Image()
    itemImg.crossOrigin = 'anonymous'
    itemImg.src = (item.url)? item.url: item.getAttribute('href')
    itemImg.onload = function(){
        itemsID += 1
        pinID += 1
        const pushObj = {
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
            eleRotate: 0,
        }
        const leftRatio = (pushObj.originX + pushObj.eleWidth / 2) / canvasInfo.width * 100
        const topRatio = (pushObj.originY + pushObj.eleHeight / 2) / canvasInfo.height * 100
        const pinInfoObj = {
            id: pinID,
            itemsID,
            prodID: item.prodID,
            pinLeft: leftRatio,
            pinTop: topRatio,
        }
        imgItems.push(pushObj)
        canvasPins.push(pinInfoObj)
        drawItems(imgItems)
    }
}

// 建立錨點DOM元件
function makePinNode(autoFocus) {
    // =================== start ===================
    //  錨點功能相關區塊
    // ===================  end  ===================
    // pin button
    const pinBtn = document.createElement('button')
    pinBtn.classList.add('btn', 'btn-pin')
    pinBtn.setAttribute('type', 'button')
    const pinIcon = document.createElement('i')
    pinIcon.classList.add('icon', 'icon-pin')
    pinBtn.appendChild(pinIcon)

    // 功能按鈕區
    //> 功能外框
    const editorBox = document.createElement('div')
    editorBox.classList.add('editor-box')

    if(!autoFocus) {
        //> 修改按鈕
        const pinEditorBtn = document.createElement('button')
        pinEditorBtn.classList.add('btn', 'btn-editor')
        pinEditorBtn.setAttribute('type', 'button')
        const editorIcon = document.createElement('i')
        editorIcon.classList.add('icon', 'icon-cog')
        pinEditorBtn.appendChild(editorIcon)
        editorBox.appendChild(pinEditorBtn)
    }

    //> 刪除按鈕
    const pinDeleteBtn = document.createElement('button')
    pinDeleteBtn.classList.add('btn', 'btn-delete')
    pinDeleteBtn.setAttribute('type', 'button')
    const deleteIcon = document.createElement('i')
    deleteIcon.classList.add('icon', 'icon-trash')
    pinDeleteBtn.appendChild(deleteIcon)
    editorBox.appendChild(pinDeleteBtn)

    // input區塊
    const keyinBox = document.createElement('input')
    keyinBox.classList.add('pin-product')
    keyinBox.setAttribute('type', 'text')
    keyinBox.setAttribute('readonly', true)
    if(autoFocus) {
        keyinBox.value = autoFocus
    }

    // 外包區塊
    const pinBox = document.createElement('div')
    pinBox.classList.add('pin-target')
    if(autoFocus) {
        pinBox.classList.add('on-autofocus')
    }
    pinBox.appendChild(pinBtn)
    pinBox.appendChild(editorBox)
    pinBox.appendChild(keyinBox)

    return pinBox
}

// 繪製新錨點
function drawNewPin(obj, parent) {
    const {id, pinLeft, pinTop, prodID} = obj
    if(prodID) {
        const pinBox = makePinNode(prodID)
        pinBox.id = `prodictPin_${id}`
        parent.appendChild(pinBox)
        $(`#prodictPin_${id}`).css({
            top: `${pinTop}%`,
            left: `${pinLeft}%`,
        })
        if(pinLeft > 50) {
            pinBox.classList.add('theme-right')
        }
    }
}

// 建立新錨點
function addPin(editor, e) {
    pinID += 1
    const editorOffset = $(editor).offset()
    const topRatio = (e.clientY - editorOffset.top + $(window).scrollTop()) / editor.offsetHeight * 100
    const leftRatio = (e.clientX - editorOffset.left + $(window).scrollLeft()) / editor.offsetWidth * 100
    const pinInfoObj = {
        id: pinID,
        itemsID: null,
        pinLeft: leftRatio,
        pinTop: topRatio,
    }

    canvasPins.push(pinInfoObj)
    drawNewPin(pinInfoObj, editor)
}

// 清空PIN畫板
function clearEditor(target) {
    while (target.firstChild) {
        target.removeChild(target.firstChild);
    }
}

// 繪製PIN畫板
function renderEditor(target, ary) {
    if(ary.length) {
        ary.forEach((item) => {
            drawNewPin(item, target)
        })
    }
}

// 刪除PIN
function deletePin(itemID, pinID) {
    let sliceIndex
    if(itemID) {
        sliceIndex = canvasPins.findIndex(item => item.itemsID === Number(itemID))
    } else {
        sliceIndex = canvasPins.findIndex(item => item.id === Number(pinID))
    }

    if(sliceIndex !== -1) {
        canvasPins.splice(sliceIndex, 1)
    }
}

// 視窗尺寸變化
;(function($, jQuery, window ,document) {
    window.addEventListener('resize', function(e) {
        e.preventDefault()
        canvasInfo.clientHeight = canvas.clientHeight
        canvasInfo.clientWidth = canvas.clientWidth
        canvasInfo.ratioX = canvas.clientWidth / canvas.width
        canvasInfo.ratioY = canvas.clientHeight / canvas.height
    })
})($, jQuery, window ,document)

// 畫板切換
;(function($, jQuery, window ,document) {
    $('.switch-button').on('click', function(e) {
        e.preventDefault()
        const $switchTarget = $('.wrapper')

        if(editorSwitch === 'canvasEditor') {
            editorSwitch = 'pinEditor'
            $switchTarget.addClass('type-pin').removeClass('type-canvas')
            clearFocus()
            renderEditor(editor, canvasPins)
        } else if(editorSwitch === 'pinEditor') {
            editorSwitch = 'canvasEditor'
            $switchTarget.removeClass('type-pin').addClass('type-canvas')
            clearEditor(editor)
        }
    })
})($, jQuery, window ,document)

// 資料載入
;(function($, jQuery, window ,document) {
    const itemButton = document.querySelectorAll('.element-group .link')

    itemButton.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault()

            const searchId = item.getAttribute('href')
            jQuery.ajax({
                type: 'POST',
                url: 'https://next.json-generator.com/api/json/get/NkJvakK8q',
                async: true,
                data: {
                    prodID: searchId,
                },
                dataType: 'json',
            }).done((res) => {
                const resAry = res
                const targetObj = resAry.find(item => item.id === searchId)
                if(!!targetObj) {
                    addNewPictureItem(targetObj)
                }
            }).fail((x, y, z) => {
                console.log(x, y, z);
            })
        })
    })

    $('#searchProducts').on('submit', function(e) {
        e.preventDefault()
        const resultAry = $(this).serializeArray()
        const resultObj = resultAry.reduce((prev, item) => {
            const {name, value} = item
            prev[name] = value.trim()
            return prev
        }, {})
        $(this).trigger('reset')

        jQuery.ajax({
            type: 'POST',
            url: 'https://next.json-generator.com/api/json/get/NkJvakK8q',
            async: true,
            data: {
                prodID: resultObj.searchById,
            },
            dataType: 'json',
        }).done((res) => {
            const resAry = res
            const targetObj = resAry.find(item => item.id === 'ajax')
            if(!!targetObj) {
                addNewPictureItem(targetObj)
            }
        }).fail((x, y, z) => {
            console.log(x, y, z);
        })
    })

})($, jQuery, window ,document)

// canvas 畫板相關功能
;(function($, jQuery, window ,document) {
    itemsID = arrayIdCheck(imgItems)
    let lastX, lastY

    canvas.addEventListener('mousedown', function(e){
        e.preventDefault()
        canvas.style.cursor = 'move'

        const naturalX = getNaturalSize(e.offsetX, canvasInfo.ratioX)
        const naturalY = getNaturalSize(e.offsetY, canvasInfo.ratioY)
        itemOnChecked = true
        lastX = null
        lastY = null

        // mouseDown check
        for (let i = 0; i < imgItems.length; i++) {
            const ele = imgItems[i]
            if(rangeCheck(ele, naturalX, naturalY)) {
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
            if(rangeCheck(ele, naturalX, naturalY)) {
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

        const targetItem = imgItems.find(item => item.checkOn)
        if(!!targetItem) {
            const itemArc = degToArc(targetItem.eleRotate)
            targetItem.originX = XaxisMove (targetItem.originX, offsetX, itemArc)
            targetItem.originY = YaxisMove (targetItem.originY, offsetY, itemArc)
        }
        drawItems(imgItems)
    })

    canvas.addEventListener('mouseup', function(e){
        e.preventDefault()
        canvas.removeAttribute('style')

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
        const hoverTarget = imgItems.find(item => item.hoverOn)
        if(!!hoverTarget) {
            hoverTarget.hoverOn = false
        }
        const checkTarget = imgItems.find(item => item.checkOn)
        if(!!checkTarget) {
            checkTarget.checkOn = false
        }

        drawItems(imgItems)
    })
})($, jQuery, window ,document)

// 錨點功能
;(function($, jQuery, window ,document) {
    pinID = arrayIdCheck(canvasPins)
    const cursorBox = document.createElement('div')
    cursorBox.classList.add('pin-cursor')


    editor.addEventListener('mouseenter', function(e) {
        e.preventDefault()
        this.appendChild(cursorBox)
    })
    editor.addEventListener('mouseleave', function(e) {
        e.preventDefault()
        this.removeChild(cursorBox)
    })
    editor.addEventListener('mousemove', function(e) {
        e.preventDefault()
        const editorOffset = $(this).offset()
        const topRatio = (e.clientY - editorOffset.top + $(window).scrollTop()) / editor.offsetHeight * 100
        const leftRatio = (e.clientX - editorOffset.left + $(window).scrollLeft()) / editor.offsetWidth * 100

        $(cursorBox).css({
            top: `${topRatio}%`,
            left: `${leftRatio}%`,
        })
    })

    // 摸到既存的PIN時，不顯示focus圖示
    $(editor).on('mouseenter', '.btn-pin, .editor-box, .pin-product:not([readonly])', function(e) {
        e.preventDefault()
        $(cursorBox).fadeOut(100)
    })
    $(editor).on('mouseleave', '.btn-pin, .editor-box, .pin-product:not([readonly])', function(e) {
        e.preventDefault()
        $(cursorBox).fadeIn(100)
    })

    // 判斷是否要添加PIN
    $(editor).on('click', function(e) {
        e.preventDefault()

        if($(e.target).hasClass('pin-cursor') || $(e.target).attr('readonly')) {
            addPin(this, e)
            $(this).find('.pin-product').eq(0).trigger('focus')
        }
    })
    let pinOnClick = false
    let nowTimeStamp = 0

    $(editor).on('mousedown', '.btn-pin', function(e) {
        e.preventDefault()
        pinOnClick = true
        nowTimeStamp = e.timeStamp
    })

    $(editor).on('mouseup', function(e) {
        e.preventDefault()
        pinOnClick = false
        const timeDuration = e.timeStamp - nowTimeStamp

        if(timeDuration < 200 && $(e.target).hasClass('icon-pin')){
            $(e.target).parents('.btn-pin').siblings('.editor-box').fadeToggle(250)
        }
    })

    $(editor).on('mousemove', '.btn-pin', function(e) {
        e.preventDefault()
        const editorOffset = $(editor).offset()
        const topRatio = (e.clientY + $(this).height() / 2 - editorOffset.top + $(window).scrollTop()) / editor.offsetHeight * 100
        const leftRatio = (e.clientX - $(this).width() * 0  - editorOffset.left + $(window).scrollLeft()) / editor.offsetWidth * 100

        if(pinOnClick && !$(this).parents('.pin-target').hasClass('on-autofocus')) {
            $(this).parents('.pin-target').css({
                top: `${topRatio}%`,
                left: `${leftRatio}%`,
            })
            if(leftRatio >= 50) {
                $(this).parents('.pin-target').addClass('theme-right')
            } else {
                $(this).parents('.pin-target').removeClass('theme-right')
            }
        }
    })

    // 暫存PIN商品編號
    $(editor).on('blur', '.pin-product', function(e) {
        e.preventDefault()
        $(this).attr('readonly', true)
    })
    $(editor).on('keypress', '.pin-product', function(e) {
        if(e.keyCode === 13) {
            $(this).trigger('blur')
        }
    })

    // 編輯器關閉
    $(editor).on('click', '.editor-box .btn', function(e) {
        e.preventDefault()
        $(this).parents('.editor-box').fadeOut(250)
    })

    // 修改PIN商品編號
    $(editor).on('click', '.editor-box .btn-editor', function(e) {
        e.preventDefault()
        $(this).parents('.pin-target').find('.pin-product').trigger('focus').attr('readonly', false)
    })

    // 刪除PIN
    $(editor).on('click', '.editor-box .btn-delete', function(e) {
        e.preventDefault()
        const $target = $(this).parents('.pin-target')
        const targetPinId = $target.attr('id').split('_')[1]
        deletePin(null, targetPinId)
        $target.remove()
    })
})($, jQuery, window ,document)

// 按鈕功能組
;(function($, jQuery, window ,document) {
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
        imgItems.forEach((item) => {
            deletePin(item.id, null)
        })
        imgItems.length = 0
        drawItems(imgItems)
    })

    // 刪除選取元件
    document.getElementById('deleteItem').addEventListener('click', function(e) {
        e.preventDefault()
        const targetIndex = imgItems.findIndex(item => item.focusOn)
        if(targetIndex !== -1) {
            deletePin(imgItems[targetIndex].id, null)
            imgItems.splice(targetIndex, 1)
            drawItems(imgItems)
        }
    })

    // 往前一層
    document.getElementById('goForwardLayer').addEventListener('click', function(e) {
        e.preventDefault()
        changeLayerOrder(imgItems, 'goForward')
    })

    // 往後一層
    document.getElementById('goBackwardLayer').addEventListener('click', function(e) {
        e.preventDefault()
        changeLayerOrder(imgItems, 'goBackward')
    })

    // 移至最前
    document.getElementById('goFrontLayer').addEventListener('click', function(e) {
        e.preventDefault()
        changeLayerOrder(imgItems, 'goFront')
    })

    // 移至最後
    document.getElementById('goBackLayer').addEventListener('click', function(e) {
        e.preventDefault()
        changeLayerOrder(imgItems, 'goBack')
    })

    // 放大
    document.getElementById('zoomIn').addEventListener('click', function(e) {
        e.preventDefault()
        const targetItem = imgItems.find(item => item.focusOn)
        if(!!targetItem) {
            const zoomInHeight = targetItem.eleHeight + targetItem.originHeight / 10
            const zoomInWidth = targetItem.eleWidth + targetItem.originWidth / 10
            targetItem.eleHeight = zoomInHeight
            targetItem.eleWidth = zoomInWidth
            drawItems(imgItems)
        }
    })

    // 縮小
    document.getElementById('zoomOut').addEventListener('click', function(e) {
        e.preventDefault()
        const targetItem = imgItems.find(item => item.focusOn)
        if(!!targetItem) {
            const zoomOutHeight = targetItem.eleHeight - targetItem.originHeight / 10
            const zoomOutWidth = targetItem.eleWidth - targetItem.originWidth / 10
            targetItem.eleHeight = (zoomOutHeight > 0)? zoomOutHeight: 0
            targetItem.eleWidth = (zoomOutWidth > 0)? zoomOutWidth: 0
            drawItems(imgItems)
        }
    })

    // 順時針旋轉
    document.getElementById('clockWise').addEventListener('click', function(e) {
        e.preventDefault()
        const targetItem = imgItems.find(item => item.focusOn)
        if(!!targetItem) {
            targetItem.eleRotate = (targetItem.eleRotate + 15) % 360
            drawItems(imgItems)
        }
    })

    // 逆時針旋轉
    document.getElementById('antiClockWise').addEventListener('click', function(e) {
        e.preventDefault()
        const targetItem = imgItems.find(item => item.focusOn)
        if(!!targetItem) {
            targetItem.eleRotate = (targetItem.eleRotate - 15) % 360
            drawItems(imgItems)
        }
    })

    // 清除所有錨點
    document.getElementById('clearPin').addEventListener('click', function(e) {
        e.preventDefault()
        canvasPins.length = 0
        clearEditor(editor)
    })
})($, jQuery, window ,document)

// 多行文字繪製
// (function() {
//     var width = canvas.width;
//     var height = canvas.height;
//     ctx.font = '160px sans-serif';
//     var tempImg = new Image();
//     tempImg.width = width;
//     tempImg.height = height;
//     tempImg.onload = function () {
//         // 把img绘制在canvas画布上
//         ctx.drawImage(this, 0, 0, width, height);
//     };
//     const ctLorem = '為什麼我對自身的血肉，看著你自己的身影幻出種種詭異的變相，自由與自在的時候，你是不認識你父親的，同時她們講你生前的故事，但那晚雖則結識了一個可愛的小友，你知道的是慈母的愛，想中止也不可能，卻難尋同樣的淚晶。活潑，扮一個漁翁，日子雖短，這才初次明白曾經有一點血肉從我自己的生命裏分出，雖則我聽說他的名字常在你的口邊，一經同伴的牴觸，為什麼我對自身的血肉，加緊我們腳脛上的鏈，葛德說，再也不容追贖，你媽說，比你住久的，也只有她，許是恨，看著你自己的身影幻出種種詭異的變相，打攪你的清聽！我自身的父母，那美秀風景的全部正像畫片似的展露在你的眼前，更不提一般黃的黃麥，有時一澄到底的清澈，山勢與地形的起伏裡，我只能問！我，他們的獨子，只要把話匣開上，我，但想起我做父親的往迹，今天已是壯年；昨天腮邊還帶著圓潤的笑渦，就這悲哀的人生也是因人差異，也是愛音樂的；雖則你回去的時候剛滿三歲，知道你，你去時也還是一個光亮，去時自去：正如你生前我不知欣喜，你媽說，你應得躲避她像你躲避青草裡一條美麗的花蛇！把一個小花圈掛上你的門前那時間我，也不免加添他們的煩愁，我也不易使他懂我的話，她們又講你怎樣喜歡拿著一根短棍站在桌上摹仿音樂會的導師，可以懂得我話裏意味的深淺，那天在柏林的會館裏，她都講給我聽過。我，你媽說，葛德說，與自然同在一個脈搏裡跳動，不如意的人生，在這道上遭受的，體態的秀美，窮困時不窮困，卻不是來作客；我們是遭放逐，你生前日常把弄的玩具小車，後來怎樣她們干涉了你，誰沒有怨，還不止是難，學一個太平軍的頭目，直到你的影像活現在我的眼前，(一九二五年七月)但我的情愫！'
//     const lorem = 'Vivamus volutpat sollicitudin tristique. Praesent ut varius turpis. Suspendisse condimentum tincidunt arcu congue convallis. Duis imperdiet efficitur justo, id interdum dolor viverra nec. In eget nisl porta, posuere erat in, malesuada quam. In ut purus ut nibh sodales posuere in posuere eros. In faucibus felis a ultrices mollis. Aliquam erat volutpat. Cras eget tincidunt odio, eget imperdiet lorem. Donec facilisis euismod tincidunt. Aliquam sit amet ipsum justo. Donec vel arcu ut ligula posuere pharetra. Aenean porttitor in enim eget congue. Ut porta quam sed sodales pellentesque. Aenean fringilla metus at ex fringilla, quis dignissim mi laoreet.'

//     tempImg.src = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="${width}" height="${height}"><body xmlns="http://www.w3.org/1999/xhtml" style="margin:0;font:${ctx.font};">${ctLorem}</body></foreignObject></svg>`
// })()
