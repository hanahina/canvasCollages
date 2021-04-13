;(function() {
    for(let i = 0; i < 10; i++) {
        setTimeout(function() {
            console.log(i)
        }, 1000 * i)
    }
    console.log('hello world!!!!')
})()