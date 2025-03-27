const msyql = require('mysql');
require('dotenv').config();

const conexion = msyql.createConnection({
    host:'localhost',
    user:process.env.DBUSER,
    password:process.env.DBPASSWORD,
    database:'tecno_fix',
});

conexion.connect((error)=>{
    if(error){
        console.error('Se a presento un error'+error);
        return;
    }
    console.log('Se conecto exitosamente');
});

module.exports=conexion;