const express = require('express');
const app = express();
const path = require('path');
app.use(express.static('public'));
app.set('view engine','ejs');

app.use(express.urlencoded({extends:false}));
app.use(express.json());

app.set('views', path.join(__dirname, 'views'));
app.set('controller', path.join(__dirname, 'controller'));

//app.get('/', (req,res)=>{
//
//    res.send('Este es un mensaje en la ruta');
//});

app.use('/',require('./router'))

app.listen(5000,()=>{
    console.log("Servidor Local http://localhost:5000");

});

