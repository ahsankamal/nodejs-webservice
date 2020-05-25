const express = require("express");
const mysql = require("mysql2");
const app723 = express();
const Client = require('ssh2').Client;
const ssh723 = new Client();

app723.use(express.json());

let db723;
const connection = new Promise(function(resolve, reject){
	ssh723.on('ready', () => {
        ssh723.forwardOut('127.0.0.1', 3306, 'db.cs.dal.ca',3306, (err, stream) => {
	      if (err) throw err;
	      	db723 = mysql.createConnection({
	          host     : 'db.cs.dal.ca',
	          user     : 'akamal',
	          password : 'B00853723', 
	          database : 'akamal',
	          stream: stream
	        });

		    db723.connect(function(err){
                console.log("MYSQL connected.")
			    if (err) {
				    resolve(connection);
			    } else {
				reject(err);
			}
		});
	  });
	}).connect({
	  host: 'bluenose.cs.dal.ca',
	  port: 22,
	  username: 'akamal',
	  password: 'B00853723'
	});
}).catch((err) => { if(err) throw err;})

const PORT723 = process.env.PORT || 3000;
const { check, validationResult, checkSchema } = require('express-validator');

app723.get('/', (req, res) =>
    res.send(`Hello from Jobs server`)
);

// get request to fetch jobs list from db
app723.get('/api723/jobs',
(req, res) =>{
    let query723 = db723.query("SELECT * from jobparts ", (err, results)=>{
        if(err){
            throw err;
        }
        console.log(results)
        res.send(results)
    });
});

// get request to fetch specific job from db based on jobId and partId
app723.get('/api723/jobs/:jobId/:partId', checkSchema({
    partId: {
      in: [ 'query'],
      errorMessage: 'partId is invalid',
      isInt: true,
      toInt: true
    }}),
    (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    let query723 =  db723.query(`SELECT * from jobparts WHERE jobName = '${req.params.jobId}' and partId = ${parseInt(req.params.partId)}`, (err, result)=>{
        console.log(result)
        console.log(`SELECT * from jobparts WHERE jobName = '${req.params.jobId}' and partId = ${parseInt(req.params.partId)}`)
        if(err){
            throw err
        }
        if(result===undefined || result.length===0){
            res.status (404).send (`Job with jobID ${req.params.jobId} and partID ${req.params.partId} was not found`)
        }else{
            res.send(result)
        }
    });
});

//post req to create new job in jobparts table
app723.post('/api723/jobs', [
        check('jobId').notEmpty(),
        check('partId').notEmpty(),
        check('partId').isInt(),
        check('qty').isInt()
    ], (req, res) =>{
    // Finds the validation errors in this request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    console.log(`In app723.post with jobId: ${req.body.jobId}, partId: ${req.body.partId}, qty: ${req.body.qty}`);    
    let sqlSelect723 = `SELECT * from jobparts where jobName = '${req.body.jobId}' and partId = ${parseInt(req.body.partId)}`
    let sql723 = "INSERT into jobparts SET ?"

    let querySelect = db723.query(sqlSelect723, (err, results) => {
        console.log(sqlSelect723)
        console.log(results)
        const job723 = { jobName: req.body.jobId, partId: parseInt(req.body.partId), qty: parseInt(req.body.qty)}
        if(results===undefined || results.length===0){
            console.log("job not found and to be inserted")
            let query = db723.query(sql723, job723, (err, result)=>{
                if(err){
                    throw err
                }
                console.log(`Job with jobId: ${req.body.jobId} and partID: ${req.body.partId} successfully inserted`)
                res.send(job723)
            });
        }
        else{
            console.log(`Job with jobId: ${req.body.jobId} and partID: ${req.body.partId} exists already`);
            res.status(404).send(`Job with jobId: ${req.body.jobId} and partID: ${req.body.partId} exists already`)
        }
    })
    
});

//put req to update existing job in jobparts table
app723.put('/api723/jobs',  [
    check('jobId').notEmpty(),
    check('partId').notEmpty(),
    check('partId').isInt(),
    check('qty').isInt()
    ], (req, res) =>{
    // Finds the validation errors in this request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    console.log(`In app723.put with jobId: ${req.body.jobId}, partId: ${req.body.partId}, qty: ${req.body.qty}`);
    
    let sqlSelect723 = `SELECT * from jobparts where jobName = '${req.body.jobId}' and partId = ${parseInt(req.body.partId)}`
    let sqlUpdate723 = `UPDATE jobparts SET qty = ${req.body.qty} where jobName = '${req.body.jobId}' and partId = ${parseInt(req.body.partId)}`
    
    let querySelect723 = db723.query(sqlSelect723, (err, results) => {
        console.log(results);
        if(results.length != 0){
            let query = db723.query(sqlUpdate723, (err, updateResult)=>{
                if(err){
                    throw err
                }
                console.log(`Job with jobId: ${req.body.jobId} and partID: ${req.body.partId}) successfully updated`)
                res.send({ jobName: req.body.jobId, partId: parseInt(req.body.partId), qty: parseInt(req.body.qty)})
            })

        }else{
            console.log(`Job with jobId: ${req.body.jobId} and partID: ${req.body.partId} does not exist`);
            res.status(404).send(`Job with jobId: ${req.body.jobId} and partID: ${req.body.partId} does not exist`)
        }
    })
    
});


app723.listen(PORT723, () =>
    console.log(`Server is running on PORT ${PORT723}`)
);