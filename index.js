const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
require('dotenv').config()

// middleware
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
    res.send('assignment-12 server is running')
})

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASS}@cluster0.ugpmzsn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run(){
    try{
        const userCollection = client.db('assignment-12-DB').collection('user')
        const categoryCollections = client.db('assignment-12-DB').collection('categoriesOfProduct');
        const productCollections = client.db('assignment-12-DB').collection('products')
        const buyerCollections = client.db('assignment-12-DB').collection('buyer')
        
        app.get('/category', async(req,res)=>{
            const query = {}
            const category = await categoryCollections.find(query).toArray()
            res.send(category)
        })
        app.post('/product',async(req,res)=>{
            const product = req.body
            const result = await productCollections.insertOne(product);
            res.send(result)
        })
        app.get('/category/:id', async(req,res)=>{
            const id = req.params.id;
            // const query = {i}
            console.log(id);
            const result = await productCollections.find({id}).toArray()
            res.send(result)
        })
        app.post('/users', async(req,res)=>{
            const user = req.body;
            const result = await userCollection.insertOne(user)
            res.send(result)
        })
        app.get('/users',async(req,res)=>{
            const query = {}
            const result = await userCollection.find(query).toArray();
            res.send(result)   

        })
        app.post('/buyer', async(req,res)=>{
            const buyer = req.body;
            const result = await buyerCollections.insertOne(buyer);
            res.send(result)
        })
        app.get('/buyer', async(req,res)=>{
            const query ={};
            const buyers = await buyerCollections.find(query).toArray()
            res.send(buyers)
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });
    }
    finally{

    }
}
run().catch(err=>console.log(err.message))

app.listen(port,()=>{
    console.log('Server is running');
})