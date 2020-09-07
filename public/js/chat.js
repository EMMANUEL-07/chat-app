const socket = io()

//elements
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room  } = Qs.parse(location.search, { ignoreQueryPrefix: true} )

//making appropraite scrolling
const autoscroll = () => {
        
    //new message element
    const $newMessage = $messages.lastElementChild

    //get height of new message
    const $newMessageStyle = getComputedStyle($newMessage)
    const $newMessageMargin = parseInt($newMessageStyle.marginBottom)
    const $newMessageHeight = $newMessage.offsetHeight + $newMessageMargin

    //visible height
    const visibleHeight =  $messages.offsetHeight

    //height of messages container
    const containerHeight =  $messages.scrollHeight

    //how far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - $newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}


socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('loc-message', ( locdata ) => {
    console.log(locdata)
    const html = Mustache.render(locationTemplate, {
        username: locdata.username,
        message: locdata.url,
        createdAt: moment(locdata.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    })
    $sidebar.innerHTML = html
})

document.querySelector("#send").addEventListener('click', (e) => {
    e.preventDefault()
    
    // disabling form
    document.querySelector("#send").setAttribute('disabled','disabled' )
    
   
    const message = document.querySelector('#text').value
    socket.emit('send', message, (error) =>{
       
        
        //enabling form
        document.querySelector("#send").removeAttribute('disabled')
        document.querySelector('#text').value = ""
        document.querySelector('#text').focus()

        if(error){
            return console.log(error)
        }

        console.log('The message was delivered')
    })

    

})

document.querySelector("#send-loc").addEventListener('click', (e) => {
    e.preventDefault()

    if(!navigator.geolocation) {
        return alert('GeoLocation is not supported by your browser')
    }

    // disabling form
    document.querySelector("#send-loc").setAttribute('disabled','disabled' )

    navigator.geolocation.getCurrentPosition( (position) => {
        const location = { latitude : position.coords.latitude, longitude: position.coords.longitude }
        //const location =  "My Location details are   : " + position.coords.latitude +", "+ position.coords.longitude
        socket.emit('loc', location, () => {
            console.log('Location shared')
            document.querySelector("#send-loc").removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert (error)
        location.href ='/' 
    }

} )