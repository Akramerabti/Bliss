

const socket = io()

socket.on('notifications', (data) => {
    console.log(data);
    if(data.length){
        const element = document.querySelector('.notifs');
        element.style.backgroundColor = 'red';
    }});