const msyql = require('mysql');

const conexion = msyql.createConnection({
    host:'localhost',
    user:'root',
    password:'12345',
    database:'tecno_fix'
});

conexion.connect((error)=>{
    if(error){
        console.error('Se a presento un error'+error);
        return;
    }
    console.log('Se conecto exitosamente');
});

module.exports=conexion;