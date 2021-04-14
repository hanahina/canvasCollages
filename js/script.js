;(function($, jQuery, window ,document) {
    const canvas = document.getElementById('canvasWrap')
    const canvasInfo = {
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        width: canvas.width,
        height: canvas.height,
        ratioX: canvas.clientWidth / canvas.width,
        ratioY: canvas.clientHeight / canvas.height,
    }
    const ctx = canvas.getContext('2d')
    let itemsID = 0
    const imgItems = []

    const itemButton = document.querySelectorAll('.element-group .link')

    itemButton.forEach(function(item) {

        item.addEventListener('click', function(e) {
            e.preventDefault()

            const itemImg = new Image()
            itemImg.src = item.getAttribute('href')
            itemImg.onload = function(){
                itemsID += 1
                ctx.drawImage(itemImg, itemsID * 100, itemsID * 100, itemImg.width, itemImg.height)

                imgItems.push({
                    id: itemsID,
                    eleHeight: itemImg.height,
                    eleWidth: itemImg.width,
                    originX: itemsID * 100,
                    originY: itemsID * 100,
                    target: itemImg,
                    focusOn: false,
                    hoverOn: false,
                    checkOn: false,
                })
            }
            console.log(imgItems);

        })
    })


    function getNaturalSize(nowNumber, ratio) {
        return Math.round(nowNumber / ratio * 100) / 100
    }

    let lastX, lastY
    canvas.addEventListener('mouseenter', function(e) {
        lastX = null
        lastY = null
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
                    imgItems[j].hoverOn = false
                }
            } else {
                ele.hoverOn = false
            }
        }

        ctx.clearRect(0, 0, canvasInfo.width, canvasInfo.height)

        imgItems.forEach(function(item) {
            const nowX = item.originX
            const nowY = item.originY

            ctx.drawImage(item.target, nowX, nowY, item.eleWidth, item.eleHeight)

            if(item.hoverOn) {
                ctx.lineWidth = 20;
                ctx.strokeStyle = 'orange';
                ctx.strokeRect(nowX, nowY, item.eleWidth, item.eleHeight)
            }

            item.originX = nowX
            item.originY = nowY
        })


        // // 圖片依滑鼠移動
        // ctx.clearRect(0, 0, canvasInfo.width, canvasInfo.height)
        // imgItems.forEach(function(item) {
        //     const nowX = item.originX + offsetX
        //     const nowY = item.originY + offsetY

        //     ctx.drawImage(item.target, nowX, nowY, item.eleWidth, item.eleHeight)
        //     item.originX = nowX
        //     item.originY = nowY
        // })

    })

    canvas.addEventListener('mousedown', function(e){
        e.preventDefault()

        const naturalX = getNaturalSize(e.offsetX, canvasInfo.ratioX)
        const naturalY = getNaturalSize(e.offsetY, canvasInfo.ratioY)

        // mouseDown check
        for (let i = 0; i < imgItems.length; i++) {
            const ele = imgItems[i]
            const {eleHeight, eleWidth, originX, originY,} = ele

            if(originX < naturalX && naturalX < originX + eleWidth && originY < naturalY && naturalY < originY + eleHeight) {
                ele.checkOn = true
                for (let j = 0; j < i; j++) {
                    imgItems[j].checkOn = false
                }
            } else {
                ele.checkOn = false
            }
            console.log(ele.id, ele.checkOn);
        }
        ctx.clearRect(0, 0, canvasInfo.width, canvasInfo.height)



        imgItems.forEach(function(item) {
            const nowX = item.originX
            const nowY = item.originY

            ctx.drawImage(item.target, nowX, nowY, item.eleWidth, item.eleHeight)

            if(item.checkOn) {
                ctx.lineWidth = 40;
                ctx.strokeStyle = 'red';
                ctx.strokeRect(nowX, nowY, item.eleWidth, item.eleHeight)
            }

            item.originX = nowX
            item.originY = nowY
        })
    })

    canvas.addEventListener('mouseup', function(e){
        e.preventDefault()

        ctx.clearRect(0, 0, canvasInfo.width, canvasInfo.height)
        imgItems.forEach(function(item) {
            item.checkOn = false
            const nowX = item.originX
            const nowY = item.originY

            ctx.drawImage(item.target, nowX, nowY, item.eleWidth, item.eleHeight)

            item.originX = nowX
            item.originY = nowY
        })
    })

})($, jQuery, window ,document)
