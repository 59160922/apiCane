const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const router = express.Router();
const sql = require('mssql');
const app = express();
const basicAuth = require('basic-auth');
const bcrypt = require('bcryptjs');

const config = {
    user: 'sqluser',
    password: 'n2jh64bq',
    server: 'DESKTOP-925OL45\\SQLEXPRESS', 
    database: 'DB_Queue' 
  };

  
  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(function (req, res, next) {
    
    res.header('Access-Control-Allow-Origin', '*');
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,TEXT');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.post('/auth',(req,res)=>{
    // let user = basicAuth(req);
    // console.log(basicAuth(req)); //prints username
    // console.log(user); 
    // res.sendStatus(200)
    let conn = new sql.ConnectionPool(config);
    conn.connect()
    .then( async function(pool){
      let request = new sql.Request(pool);
      request.query(`SELECT * FROM tb_queue_user WHERE user_name='${req.body.user}' `,async function (err,queryResult){
       
        if (err){
            console.log(err)
            res.send(err);
        }else{
             
            if(queryResult.rowsAffected[0] === 0){
                res.send({"error":"could not found user","state":"false"})
                return
            }
            let password = queryResult.recordset[0].user_password
            let passwordIsValid = await bcrypt.compare(req.body.password,password)    
           
            
                 //res.send(queryResult)
            if (!passwordIsValid){
                const state = {"state":"false"}
                res.send(state);
                return
            }
            const state = {"state":"true"}
            res.send(state);
            return
        }
          
          conn.close()
         
      })
    })
})
app.get('/isRowExisted/:row',(req,res)=>{
    let conn = new sql.ConnectionPool(config);
    conn.connect()
    .then( async function(pool){
      let request = new sql.Request(pool);
      request.query(`SELECT * FROM tb_queue_label WHERE queueLabel_row=${req.params.row}`,async function (err,queryResult){
          if (err){
            
              console.log(err)
              res.send(err);
              
          }else{
              
              if (queryResult.rowsAffected[0] > 0){
                  const state = {"state":"true"}
                   res.send(state);
              }else{
                const state = {"state":"false"}
                   res.send(state);
              }
          } 
          conn.close()
         
      })
    })

})


app.get('/getCaneTypeById/:id',(req,res)=>{
    let conn = new sql.ConnectionPool(config);

    conn.connect()
        .then(function(pool){

            let request = new sql.Request(pool);
            request.query(`SELECT * FROM tb_queue_caneType WHERE cane_id=${req.params.id}`,function (err,queryResult){
                if (err){
                    console.log(err)
                    res.send(err);
                }else{
                    res.status(200).send(true);
                }
                conn.close()
            })
        })
})
app.get('/getCaneType',  (req, res)=> {
    // connect to your database
    let conn = new sql.ConnectionPool(config);
    
    conn.connect()
         .then(function (pool) {
    
             // create Request object
             let request = new sql.Request(pool);                          
             // query to the database
             request.query('SELECT * FROM tb_queue_caneType', function (err, queryResult) {
                 if (err) {
                     console.log(err);
                     res.send(err);
                 } else {
                     res.send(queryResult );
                 }
                 conn.close();
             });
        });           
    
    
    });
    
 app.put('/update',(req,res)=>{
    let conn = new  sql.ConnectionPool(config);
    conn.connect()
    .then( function (pool) {
        let request = new sql.Request(pool);       
        request.query(`UPDATE tb_queue_label SET cane_id = '${req.body.cane}' WHERE queueLabel_row = ${req.body.row}`, function (err, queryResult) {
            if (err) {
               console.log(err);
                res.send(err);
            } else {
                res.status(201);
            }
                conn.close();
       });
    })
 })
  
  app.post('/add',  (req,res)=>{
 
    let conn = new  sql.ConnectionPool(config);
    //const Student = {name:req.body.name};
   
   
    conn.connect()
     .then( function (pool) {
  
         // create Request object
         let request = new sql.Request(pool);                          
         // query to the database
         
        console.log(req.body)
      
         request.query(`INSERT INTO tb_queue_label(queueLabel_row,cane_id) VALUES('${req.body.row}','${req.body.cane}')`, function (err, queryResult) {
                 if (err) {
                    console.log(err);
                     res.send(err);
                 } else {
                    res.sendStatus(201);
                 }
                     conn.close();
            });
        
       
         })
   
  
  })
  app.post('/register',async (req,res)=>{
    let name = req.body.name
    
    let encryptedPwd =await bcrypt.hash(req.body.password,8)

    const o = {
        name:name,
        password:encryptedPwd
    }
    let conn = new  sql.ConnectionPool(config);
    conn.connect()
    .then( function (pool) {
 
        // create Request object
        let request = new sql.Request(pool);                          
        // query to the database
        
       console.log(req.body)
     
        request.query(`INSERT INTO tb_queue_user(user_name,user_password) VALUES('${name}','${encryptedPwd}')`, function (err, queryResult) {
                if (err) {
                   console.log(err);
                    res.send(err);
                } else {
                    res.status(201).json(queryResult)
                }
                    conn.close();
           });
       
      
        })
    // const client = await require('./db')
    
    // const db = client.db('buu')
    // const r =await db.collection('user').insertOne(o).catch((err)=>{
    //     console.error(`Cannot insert data to users collection: ${err}`)
    //     req.status(500).json({error:err})
    //     return
    // })
    
    
})
  module.exports = app ;