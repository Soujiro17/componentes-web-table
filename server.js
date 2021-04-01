require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require("path");
const port = process.env.PORT;
const fs = require("fs");
const cors = require('cors');
const bodyParser = require('body-parser');
const data = require('./data.json');

// ----------------------- FUNCTIONS ----------------------//

function jsonReader(filePath, cb) {
    fs.readFile(filePath, (err, fileData) => {
        if (err) {
            return cb && cb(err)
        }
        try {
            const object = JSON.parse(fileData)
            return cb && cb(null, object)
        } catch(err) {
            return cb && cb(err)
        }
    })
}

function verifyToken(req, res, next){

    const bearerToken = req.headers['authorization'];

    if(typeof bearerToken !== 'undefined' && bearerToken !== ''){
        if(bearerToken === process.env.REACT_APP_API){
            next()
        }else{
            res.send(403)
        }
    }else{
        res.sendStatus(403)
    }


}


// ------------------------ SERVER SIDE ------------------------ //

app.use(morgan('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 1000000}));
app.use(express.json());
app.use(cors());
app.set('json spaces', 2)


// ------------------------------------------------------------ //

app.get("/", (req, res) => {
  const filePath = path.resolve(__dirname, `./build`, "index.html");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return console.log(err);
    }

    res.send(data)
  });
});

app.get("/data", verifyToken, (req, res) => {
    console.log(data)
    res.json(data)
});

app.use(express.static(path.resolve(__dirname, `./build`)));

app.post("/", verifyToken, (req, res) => {
    
    const data = req.body

    jsonReader('./data.json', (err, customer) => {
        if (err) {
            console.log('Error reading file:',err)
            return
        }

        for(let x = 0; x<data.products.length; x++){
            if(customer.products.includes(data.products[x])){
                const index = customer.products.indexOf(data.products[x])
                customer.prices[index] = data.prices[x]
                customer.stock[index] = data.stock[x]
                customer.fecha[index] = data.fecha[x]
            }else{
                customer.products.push(data.products[x]) 
                customer.prices.push(data.prices[x]) 
                customer.links.push(data.links[x]) 
                customer.stock.push(data.stock[x]) 
                customer.fecha.push(data.fecha[x])
            }
        }
    fs.writeFile('./data.json', JSON.stringify(customer, null, 2), (err) => {
            if (err) console.log('Error writing file:', err)
        })
    })

    console.log("received")
    res.send("received")
    
})

app.post("/del", verifyToken, (req, res) => {
    
    const data = req.body
    const empty = { 
        "products": [], 
        "prices": [], 
        "links": [], 
        "stock": [],
        "fecha": []
    }

    fs.writeFile('./data.json', JSON.stringify(empty, null, 2), (err) => {
            if (err) console.log('Error writing file:', err)
    })
    
    console.log("deleted")
    return res.send("deleted")

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})