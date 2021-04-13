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
        // console.log(item);

        item.addEventListener('click', function(e) {
            e.preventDefault()
            // console.log(item.getAttribute('href'));

            const itemImg = new Image()
            itemImg.src = item.getAttribute('href')
            itemImg.onload = function(){
                ctx.drawImage(itemImg, 0, 0, itemImg.width, itemImg.height)
                itemsID += 1
                imgItems.push({
                    id: itemsID,
                    height: itemImg.height,
                    width: itemImg.width,
                    originX: 0,
                    originY: 0,
                    target: itemImg,

                })

            }
            console.log(imgItems);

        })
    })

    canvas.addEventListener('mousemove', function(e) {
        e.preventDefault()

        const naturalX = Math.round(e.offsetX / canvasInfo.ratioX * 100) / 100
        const naturalY = Math.round(e.offsetY / canvasInfo.ratioY * 100) / 100

        // console.log(naturalX, naturalY);
        ctx.clearRect(0, 0, canvasInfo.width, canvasInfo.height)


        imgItems.forEach(function(item) {
            const nowX = item.originX + naturalX
            const nowY = item.originY + naturalY

            ctx.drawImage(item.target, nowX, nowY, item.width, item.height)
            item.originX = nowX
            item.originY = nowY

            console.log(item);

        })
    })

})($, jQuery, window ,document)
